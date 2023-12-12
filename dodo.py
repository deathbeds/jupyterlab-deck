"""automation for jupyterlab-deck."""
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import tempfile
import time
import typing
from pathlib import Path

import doit.tools

DOT_ENV = Path(".env")

dotenv_loaded = {}

if DOT_ENV.exists():
    dotenv_loaded = __import__("dotenv").dotenv_values(DOT_ENV)
    os.environ.update(dotenv_loaded)


class C:
    NPM_NAME = "@deathbeds/jupyterlab-deck"
    OLD_VERSION = "0.2.0a1"
    VERSION = "0.2.0"
    JS_VERSION = (
        VERSION.replace("a", "-alpha.").replace("b", "-beta.").replace("rc", "-rc.")
    )
    PACKAGE_JSON = "package.json"
    PYPROJECT_TOML = "pyproject.toml"
    PABOT_DEFAULTS = [
        "--artifactsinsubfolders",
        "--artifacts",
        "png,log,txt,svg,ipynb,json",
    ]
    PLATFORM = platform.system()
    PY_VERSION = f"{sys.version_info[0]}.{sys.version_info[1]}"
    ROBOT_DRYRUN = "--dryrun"
    NYC = ["jlpm", "nyc", "report"]
    HISTORY = "conda-meta/history"
    CONDA_RUN = ["conda", "run", "--no-capture-output", "--prefix"]
    IGNORE_SPELL_PATH = ["/genindex.html$"]


class P:
    DODO = Path(__file__)
    ROOT = DODO.parent
    BINDER = ROOT / ".binder"
    DOCS = ROOT / "docs"
    CI = ROOT / ".github"
    SCRIPTS = ROOT / "_scripts"
    DEMO_ENV_YAML = BINDER / "environment.yml"
    TEST_ENV_YAML = CI / "environment-test.yml"
    TEST_35_ENV_YAML = CI / "environment-test-lab35.yml"
    DOCS_ENV_YAML = CI / "environment-docs.yml"
    BASE_ENV_YAML = CI / "environment-base.yml"
    BUILD_ENV_YAML = CI / "environment-build.yml"
    LINT_ENV_YAML = CI / "environment-lint.yml"
    ROBOT_ENV_YAML = CI / "environment-robot.yml"
    ENV_INHERIT = {
        BUILD_ENV_YAML: [BASE_ENV_YAML],
        DEMO_ENV_YAML: [
            BASE_ENV_YAML,
            BUILD_ENV_YAML,
            DOCS_ENV_YAML,
            LINT_ENV_YAML,
            ROBOT_ENV_YAML,
            TEST_ENV_YAML,
        ],
        DOCS_ENV_YAML: [BUILD_ENV_YAML, BASE_ENV_YAML],
        TEST_ENV_YAML: [BASE_ENV_YAML, BUILD_ENV_YAML, ROBOT_ENV_YAML],
        TEST_35_ENV_YAML: [BASE_ENV_YAML, TEST_ENV_YAML, ROBOT_ENV_YAML],
        LINT_ENV_YAML: [BASE_ENV_YAML, BUILD_ENV_YAML, ROBOT_ENV_YAML],
    }
    YARNRC = ROOT / ".yarnrc.yml"
    YARN_LOCK = ROOT / "yarn.lock"
    JS = ROOT / "js"
    JS_META = JS / "_meta"
    JS_PACKAGE_JSONS = [*JS.glob(f"*/{C.PACKAGE_JSON}")]
    ALL_PACKAGE_JSONS = [*JS_PACKAGE_JSONS, ROOT / C.PACKAGE_JSON]
    JS_TS_INFO = [*JS.glob("*/tsconfig.json"), *JS.glob("*/src/tsconfig.json")]
    EXT_JS_PKG = JS / "jupyterlab-deck"
    EXT_JS_WEBPACK = EXT_JS_PKG / "webpack.config.js"
    EXT_JS_LICENSE = EXT_JS_PKG / "LICENSE"
    EXT_JS_README = EXT_JS_PKG / "README.md"
    SRC = ROOT / "src"
    PY_SRC = ROOT / "jupyterlab_deck"
    PYPROJECT_TOML = ROOT / C.PYPROJECT_TOML
    DOCS_STATIC = DOCS / "_static"
    DOCS_PY = [*DOCS.glob("*.py")]
    DOCS_DICTIONARY = DOCS / "dictionary.txt"
    EXAMPLES = ROOT / "examples"
    LITE_JSON = EXAMPLES / "jupyter-lite.json"
    LITE_CONFIG = EXAMPLES / "jupyter_lite_config.json"
    ALL_EXAMPLE_IPYNB = [*EXAMPLES.rglob("*.ipynb")]
    ALL_EXAMPLES = [*EXAMPLES.rglob("*.md"), *ALL_EXAMPLE_IPYNB]
    PAGES_LITE = ROOT / "pages-lite"
    PAGES_LITE_CONFIG = PAGES_LITE / "jupyter_lite_config.json"
    PAGES_LITE_JSON = PAGES_LITE / "jupyter-lite.json"
    ALL_PLUGIN_SCHEMA = [*JS.glob("*/schema/*.json")]
    ATEST = ROOT / "atest"
    ROBOT_SUITES = ATEST / "suites"
    SCRIPT_LABEXT = SCRIPTS / "labextension.py"
    ATEST_JP_CONFIG = ATEST / "fixtures/jupyter_config.json"


def _fromenv(name, default, *, coerce=None, lower=None):
    lower = True if lower is None else lower
    raw = os.environ.get(name, default)
    raw = raw.lower() if lower else raw
    coerce = coerce or bool
    return coerce(json.loads(raw))


class E:
    IN_CI = _fromenv("CI", "false")
    BUILDING_IN_CI = _fromenv("BUILDING_IN_CI", "false")
    TESTING_IN_CI = _fromenv("TESTING_IN_CI", "false")
    IN_RTD = _fromenv("READTHEDOCS", "False")
    IN_BINDER = _fromenv("IN_BINDER", "0")
    LOCAL = not (IN_BINDER or IN_CI or IN_RTD)
    ROBOT_RETRIES = _fromenv("ROBOT_RETRIES", "0", coerce=int)
    ROBOT_ATTEMPT = _fromenv("ROBOT_ATTEMPT", "0", coerce=int)
    ROBOT_ARGS = _fromenv("ROBOT_ARGS", "[]", coerce=list, lower=False)
    PABOT_ARGS = _fromenv("PABOT_ARGS", "[]", coerce=list, lower=False)
    WITH_JS_COV = _fromenv("WITH_JS_COV", "0", coerce=int)
    PABOT_PROCESSES = _fromenv("PABOT_PROCESSES", "4", coerce=int)
    MOZ_HEADLESS = _fromenv("MOZ_HEADLESS", "1", coerce=int)


class B:
    BUILD = P.ROOT / "build"
    ENV = P.ROOT / ".venv" if E.LOCAL else Path(sys.prefix)
    HISTORY = [ENV / C.HISTORY] if E.LOCAL else []
    ENV_LEGACY = BUILD / ".venv-legacy"
    HISTORY_LEGACY = ENV_LEGACY / C.HISTORY
    NODE_MODULES = P.ROOT / "node_modules"
    YARN_INTEGRITY = NODE_MODULES / ".yarn-state.yml"
    JS_META_TSBUILDINFO = P.JS_META / ".src.tsbuildinfo"
    DIST = P.ROOT / "dist"
    DOCS = BUILD / "docs"
    DOCS_BUILDINFO = DOCS / ".buildinfo"
    LITE = BUILD / "lite"
    STATIC = P.SRC / f"_d/share/jupyter/labextensions/{C.NPM_NAME}"
    STATIC_PKG_JSON = STATIC / C.PACKAGE_JSON
    WHEEL = DIST / f"jupyterlab_deck-{C.VERSION}-py3-none-any.whl"
    SDIST = DIST / f"jupyterlab_deck-{C.VERSION}.tar.gz"
    LITE_SHASUMS = LITE / "SHA256SUMS"
    STYLELINT_CACHE = BUILD / ".stylelintcache"
    NPM_TARBALL = DIST / f"deathbeds-jupyterlab-deck-{C.JS_VERSION}.tgz"
    DIST_HASH_DEPS = [NPM_TARBALL, WHEEL, SDIST]
    DIST_SHASUMS = DIST / "SHA256SUMS"
    ENV_PKG_JSON = ENV / f"share/jupyter/labextensions/{C.NPM_NAME}/{C.PACKAGE_JSON}"
    PIP_FROZEN = BUILD / "pip-freeze.txt"
    PIP_FROZEN_LEGACY = BUILD / "pip-freeze-legacy.txt"
    REPORTS = BUILD / "reports"
    ROBOCOV = BUILD / "__robocov__"
    REPORTS_NYC = REPORTS / "nyc"
    REPORTS_NYC_LCOV = REPORTS_NYC / "lcov.info"
    REPORTS_COV_XML = REPORTS / "coverage-xml"
    PYTEST_HTML = REPORTS / "pytest.html"
    PYTEST_HTML_LEGACY = REPORTS / "pytest-legacy.html"
    PYTEST_COV_XML = REPORTS_COV_XML / "pytest.coverage.xml"
    PYTEST_COV_XML_LEGACY = REPORTS_COV_XML / "pytest-legacy.coverage.xml"
    HTMLCOV_HTML = REPORTS / "htmlcov/index.html"
    HTMLCOV_HTML_LEGACY = REPORTS / "htmlcov-legacy/index.html"
    ROBOT = REPORTS / "robot"
    ROBOT_LATEST = ROBOT / "latest"
    ROBOT_LEGACY = ROBOT / "legacy"
    ROBOT_LOG_HTML = ROBOT_LATEST / "log.html"
    PAGES_LITE = BUILD / "pages-lite"
    PAGES_LITE_SHASUMS = PAGES_LITE / "SHA256SUMS"
    SPELLING = BUILD / "spelling"
    DOCS_DICTIONARY = SPELLING / P.DOCS_DICTIONARY.name
    EXAMPLE_HTML = BUILD / "examples"


class L:
    ALL_DOCS_MD = [*P.DOCS.rglob("*.md")]
    ALL_DOCS_STATIC = [p for p in P.DOCS.rglob("*") if not p.is_dir()]
    ALL_PY_SRC = [*P.PY_SRC.rglob("*.py")]
    ALL_PY_SCRIPTS = [*P.SCRIPTS.rglob("*.py")]
    ALL_RUFF = [P.DODO, *ALL_PY_SRC, *P.DOCS_PY, *ALL_PY_SCRIPTS]
    ALL_CSS_SRC = [*P.JS.glob("*/style/**/*.css")]
    ALL_CSS = [*P.DOCS_STATIC.rglob("*.css"), *ALL_CSS_SRC]
    ALL_JSON = [
        *P.ALL_PLUGIN_SCHEMA,
        *P.EXAMPLES.glob("*.json"),
        *P.JS.glob("*.json"),
        *P.JS.glob("*/src/**/*.json"),
        *P.PAGES_LITE.glob("*.json"),
        *P.ROOT.glob(".json"),
    ]
    ALL_MD = [
        *P.CI.rglob("*.md"),
        *P.DOCS.rglob("*.md"),
        *P.EXAMPLES.glob("*.md"),
        *P.EXAMPLES.glob("*.md"),
        *P.EXT_JS_PKG.glob("*.md"),
        *P.PAGES_LITE.glob("*.md"),
        *P.ROOT.glob("*.md"),
    ]
    ALL_TS = [*P.JS.glob("*/src/**/*.ts"), *P.JS.glob("*/src/**/*.tsx")]
    ALL_YML = [*P.BINDER.glob("*.yml"), *P.CI.rglob("*.yml"), *P.ROOT.glob("*.yml")]
    ALL_JS = [*P.JS.glob("*.js")]
    ALL_PRETTIER = [*ALL_JSON, *ALL_MD, *ALL_YML, *ALL_TS, *ALL_JS, *ALL_CSS]
    ALL_ROBOT = [*P.ATEST.rglob("*.robot"), *P.ATEST.rglob("*.resource")]


class U:
    @staticmethod
    def do(args, **kwargs):
        cwd = kwargs.pop("cwd", P.ROOT)
        shell = kwargs.pop("shell", False)
        return doit.tools.CmdAction(args, shell=shell, cwd=cwd, **kwargs)

    @staticmethod
    def source_date_epoch():
        return (
            subprocess.check_output(["git", "log", "-1", "--format=%ct"])
            .decode("utf-8")
            .strip()
        )

    @staticmethod
    def hash_files(hashfile, *hash_deps):
        from hashlib import sha256

        if hashfile.exists():
            hashfile.unlink()

        lines = [
            f"{sha256(p.read_bytes()).hexdigest()}  {p.name}" for p in sorted(hash_deps)
        ]

        output = "\n".join(lines)
        print(output)
        hashfile.write_text(output)

    @staticmethod
    def pip_list(frozen_file=None, pip_args=None):
        frozen_file = frozen_file or B.PIP_FROZEN
        pip_args = pip_args or [sys.executable, "-m", "pip"]
        frozen_file.parent.mkdir(exist_ok=True, parents=True)
        frozen_file.write_bytes(
            subprocess.check_output([*pip_args, "list", "--format=freeze"]),
        )
        with frozen_file.open("a", encoding="utf-8") as fd:
            fd.write(f"\n# {time.time()}\n")

    @staticmethod
    def copy_one(src, dest):
        if not dest.parent.exists():
            dest.parent.mkdir(parents=True)
        if dest.exists():
            dest.unlink()
        shutil.copy2(src, dest)

    @staticmethod
    def copy_some(dest, srcs):
        for src in srcs:
            U.copy_one(src, dest / src.name)

    @staticmethod
    def clean_some(*paths):
        for path in paths:
            if path.is_dir():
                shutil.rmtree(path)
            elif path.exists():
                path.unlink()

    @staticmethod
    def ensure_version(path: Path):
        text = path.read_text(encoding="utf-8")
        if path.name == C.PACKAGE_JSON:
            old = f'"version": "{C.OLD_VERSION}"'
            expected = f'"version": "{C.VERSION}"'
            parse = json.loads
        elif path.name == C.PYPROJECT_TOML:
            old = f'version = "{C.OLD_VERSION}"'
            expected = f'version = "{C.VERSION}"'
            parse = __import__("tomli").loads

        if expected in text:
            return True

        if E.IN_CI:
            print(f"{path} does not contain: {expected}")
            return False

        new_text = text.replace(old, expected)

        parse(new_text)

        print(f"Patching {path} with: {expected}")
        path.write_text(new_text)
        return None

    @staticmethod
    def update_env_fragments(dest_env: Path, src_envs: typing.List[Path]):
        dest_text = dest_env.read_text(encoding="utf-8")
        print(f"... adding packages to {dest_env.relative_to(P.ROOT)}")
        for src_env in src_envs:
            print(f"    ... from {src_env.relative_to(P.ROOT)}")
            src_text = src_env.read_text(encoding="utf-8")
            pattern = f"""  ### {src_env.name} ###"""
            src_chunk = src_text.split(pattern)[1]
            dest_chunks = dest_text.split(pattern)
            dest_text = "\n".join(
                [
                    dest_chunks[0].strip(),
                    pattern,
                    f"  {src_chunk.strip()}",
                    pattern,
                    f"  {dest_chunks[2].strip()}",
                ],
            )
        dest_env.write_text(dest_text.strip() + "\n")

    @staticmethod
    def make_robot_tasks(lab_env: Path, out_root: Path, extra_args=None):
        extra_args = extra_args or []
        name = "robot"
        file_dep = [lab_env / C.HISTORY, *L.ALL_ROBOT]
        if C.ROBOT_DRYRUN in extra_args:
            name = f"{name}:dryrun"
        else:
            file_dep += [*L.ALL_PY_SRC, *L.ALL_TS, *L.ALL_JSON]
            if lab_env == B.ENV:
                file_dep += [B.PIP_FROZEN]
            else:
                file_dep += [B.PIP_FROZEN_LEGACY]
        out_dir = out_root / U.get_robot_stem(
            attempt=1,
            extra_args=extra_args,
        )
        targets = [
            out_dir / "output.xml",
            out_dir / "log.html",
            out_dir / "report.html",
        ]

        yield {
            "name": name,
            "uptodate": [
                doit.tools.config_changed({"cov": E.WITH_JS_COV, "args": E.ROBOT_ARGS}),
            ],
            "file_dep": file_dep,
            "actions": [(U.run_robot_with_retries, [lab_env, out_root, extra_args])],
            "targets": targets,
        }

    @staticmethod
    def run_robot_with_retries(lab_env, out_root, extra_args=None):
        extra_args = [*(extra_args or []), *E.ROBOT_ARGS]
        is_dryrun = C.ROBOT_DRYRUN in extra_args

        fail_count = -1

        retries = E.ROBOT_RETRIES
        attempt = E.ROBOT_ATTEMPT

        if is_dryrun:
            retries = 0
            attempt = 0

        while fail_count != 0 and attempt <= retries:
            attempt += 1
            print(f"attempt {attempt} of {retries + 1}...", flush=True)
            start_time = time.time()
            fail_count = U.run_robot(
                lab_env=lab_env,
                out_root=out_root,
                attempt=attempt,
                extra_args=extra_args,
            )
            print(
                fail_count,
                "failed in",
                int(time.time() - start_time),
                "seconds",
                flush=True,
            )

        if is_dryrun:
            return fail_count == 0

        final = out_root / "output.xml"

        all_robot = [
            str(p)
            for p in out_root.rglob("output.xml")
            if p != final and "dry_run" not in str(p) and "pabot_results" not in str(p)
        ]

        runner = ["python"]

        if lab_env != B.ENV:
            runner = [*C.CONDA_RUN, str(lab_env), *runner]

        subprocess.call(
            [
                *runner,
                "-m",
                "robot.rebot",
                "--name",
                "🃏",
                "--nostatusrc",
                "--merge",
                *all_robot,
            ],
            cwd=out_root,
        )

        screens = out_root / "screenshots"

        if screens.exists():
            shutil.rmtree(screens)

        screens.mkdir(parents=True)

        for screen_root in out_root.glob("*/screenshots/*"):
            if screen_root.is_dir():
                shutil.copytree(screen_root, screens / screen_root.name)

        return fail_count == 0

    @staticmethod
    def get_robot_stem(
        attempt=0,
        extra_args=None,
        browser="headlessfirefox",
    ):
        """Get the directory in B.ROBOT for this platform/app."""
        extra_args = extra_args or []

        browser = browser.replace("headless", "")

        stem = f"{C.PLATFORM[:3].lower()}_{C.PY_VERSION}_{browser}_{attempt}"

        if C.ROBOT_DRYRUN in extra_args:
            stem = "dry_run"

        return stem

    @staticmethod
    def prep_robot(out_dir: Path):
        if out_dir.exists():
            print(f">>> trying to clean out {out_dir}", flush=True)
            try:
                shutil.rmtree(out_dir)
            except Exception as err:
                print(
                    f"... error, hopefully harmless: {err}",
                    flush=True,
                )

        if not out_dir.exists():
            print(
                f">>> trying to prepare output directory: {out_dir}",
                flush=True,
            )
            try:
                out_dir.mkdir(parents=True)
            except Exception as err:
                print(
                    f"... Error, hopefully harmless: {err}",
                    flush=True,
                )

    @staticmethod
    def run_robot(out_root: Path, lab_env: Path, attempt=0, extra_args=None):
        import lxml.etree as ET

        extra_args = extra_args or []

        stem = U.get_robot_stem(attempt=attempt, extra_args=extra_args)
        out_dir = out_root / stem

        if attempt > 1:
            extra_args += ["--loglevel", "TRACE"]
            prev_stem = U.get_robot_stem(attempt=attempt - 1, extra_args=extra_args)
            previous = out_root / prev_stem / "output.xml"
            if previous.exists():
                extra_args += ["--rerunfailed", str(previous)]

        runner = [
            "pabot",
            *("--processes", E.PABOT_PROCESSES),
            *C.PABOT_DEFAULTS,
            *E.PABOT_ARGS,
        ]

        if lab_env == B.ENV_LEGACY:
            runner = [*C.CONDA_RUN, str(lab_env), *runner]
            extra_args += ["--exclude", "app:nb"]

        if C.ROBOT_DRYRUN in extra_args:
            runner = ["robot"]

        args = [
            *runner,
            *(["--name", f"{C.PLATFORM[:3]}{C.PY_VERSION}"]),
            *(["--randomize", "all"]),
            # variables
            *(["--variable", f"ATTEMPT:{attempt}"]),
            *(["--variable", f"OS:{C.PLATFORM}"]),
            *(["--variable", f"PY:{C.PY_VERSION}"]),
            *(["--variable", f"ROOT:{P.ROOT}"]),
            # files
            *(["--xunit", out_dir / "xunit.xml"]),
            *(["--outputdir", out_dir]),
            # dynamic
            *extra_args,
        ]

        str_args = [*map(str, [*args, P.ROBOT_SUITES])]

        print(">>> ", " ".join(str_args), flush=True)

        U.prep_robot(out_dir)

        proc = subprocess.Popen(str_args, cwd=P.ATEST)

        try:
            proc.wait()
        except KeyboardInterrupt:
            proc.kill()
            proc.wait()

        out_xml = out_dir / "output.xml"
        fail_count = -1

        try:
            root = ET.fromstring(out_xml.read_bytes())
            stat = root.xpath("//total/stat")
            fail_count = int(stat[0].attrib["fail"])
        except Exception as err:
            print(err)

        return fail_count

    @staticmethod
    def run_nyc(root: Path):
        with tempfile.TemporaryDirectory() as td:
            args = [*C.NYC, "--report-dir", B.REPORTS_NYC, "--temp-dir", td]
            tdp = Path(td)
            for cov_file in root.rglob("*.cov.json"):
                shutil.copy2(cov_file, tdp / cov_file.name)
            subprocess.call(list(map(str, args)))

    @staticmethod
    def rel(*paths):
        return [p.relative_to(P.ROOT) for p in paths]

    @staticmethod
    def should_check(path: Path) -> bool:
        return "_static" not in str(path.relative_to(B.DOCS))

    @staticmethod
    def should_spell(path: Path) -> bool:
        stem = path.relative_to(P.ROOT).as_posix()
        return any(re.search(pattern, stem) is None for pattern in C.IGNORE_SPELL_PATH)

    @staticmethod
    def merge_spell_dictonaries(
        dest: Path,
        sources: typing.List[Path],
        extra_lines: typing.Optional[typing.List[str]] = None,
    ) -> bool:
        lines = extra_lines or []
        for src in sources:
            if not src.exists():
                print(f"!!! dictionary not found: {src}")
                return False
            lines += src.read_text(encoding="utf-8").strip().split()
        dest.parent.mkdir(exist_ok=True, parents=True)
        dest.write_text("\n".join(sorted(set(lines))).strip(), encoding="utf-8")
        return True

    @staticmethod
    def check_one_spell(dictionary: Path, html: Path, findings: Path):
        proc = subprocess.Popen(
            [
                "hunspell",
                "-d=en-GB,en_US",
                "-p",
                dictionary,
                "-l",
                "-H",
                str(html),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        stdout, stderr = proc.communicate()
        out_text = "\n".join([stdout.decode("utf-8"), stderr.decode("utf-8")]).strip()
        out_text = "\n".join(sorted(set(out_text.splitlines())))
        findings.write_text(out_text, encoding="utf-8")
        if out_text.strip():
            print("...", html)
            print(out_text)
            return False
        return None

    @staticmethod
    def rewrite_links(path: Path):
        text = path.read_text(encoding="utf-8")
        text = text.replace(".md", ".html")
        text = text.replace(".ipynb", ".ipynb.html")
        path.write_text(text)

    @staticmethod
    def lab(lab_env: Path):
        fake_home = lab_env / ".fake_home"
        if fake_home.exists():
            shutil.rmtree(fake_home)
        fake_home.mkdir(parents=True)

        env = dict(**os.environ)
        env["HOME"] = str(fake_home)

        run_args = [*C.CONDA_RUN, str(lab_env)]
        args = [*run_args, "jupyter", "lab", "--config", P.ATEST_JP_CONFIG]

        str_args = list(map(str, args))
        print(">>>", "\t".join(str_args))
        proc = subprocess.Popen(str_args, stdin=subprocess.PIPE, env=env)

        try:
            proc.wait()
        except KeyboardInterrupt:
            print("attempting to stop lab, you may want to check your process monitor")
            proc.terminate()
            proc.communicate(b"y\n")

        proc.wait()
        return True

    @staticmethod
    def make_pytest_tasks(file_dep, pytest_html, htmlcov, pytest_cov_xml):
        yield {
            "name": "pytest",
            "file_dep": file_dep,
            "actions": [
                [
                    "pytest",
                    "--pyargs",
                    P.PY_SRC.name,
                    f"--cov={P.PY_SRC.name}",
                    "--cov-branch",
                    "--no-cov-on-fail",
                    "--cov-fail-under=100",
                    "--cov-report=term-missing:skip-covered",
                    f"--cov-report=html:{htmlcov.parent}",
                    f"--html={pytest_html}",
                    "--self-contained-html",
                    f"--cov-report=xml:{pytest_cov_xml}",
                ],
            ],
            "targets": [pytest_html, htmlcov, pytest_cov_xml],
        }


def task_env():
    for env_dest, env_src in P.ENV_INHERIT.items():
        yield {
            "name": f"conda:{env_dest.name}",
            "targets": [env_dest],
            "file_dep": [*env_src],
            "actions": [(U.update_env_fragments, [env_dest, env_src])],
        }


def task_setup():
    if E.TESTING_IN_CI:
        return

    dedupe = []
    if E.LOCAL:
        dedupe = [["jlpm", "yarn-berry-deduplicate", "-s", "fewer", "--fail"]]
        yield {
            "name": "conda",
            "file_dep": [P.DEMO_ENV_YAML],
            "targets": [*B.HISTORY],
            "actions": [
                [
                    "mamba",
                    "env",
                    "update",
                    "--prefix",
                    B.ENV,
                    "--file",
                    P.DEMO_ENV_YAML,
                ],
            ],
        }

    if E.LOCAL or not B.YARN_INTEGRITY.exists():
        yield {
            "name": "yarn",
            "file_dep": [
                P.YARNRC,
                *B.HISTORY,
                *P.ALL_PACKAGE_JSONS,
                *([P.YARN_LOCK] if P.YARN_LOCK.exists() else []),
            ],
            "actions": [
                ["jlpm", *([] if E.LOCAL else ["--immutable"])],
                *dedupe,
            ],
            "targets": [B.YARN_INTEGRITY],
        }


def task_legacy():
    yield {
        "name": "conda",
        "file_dep": [P.TEST_35_ENV_YAML],
        "targets": [B.HISTORY_LEGACY],
        "actions": [
            [
                "mamba",
                "env",
                "update",
                "--prefix",
                B.ENV_LEGACY,
                "--file",
                P.TEST_35_ENV_YAML,
            ],
        ],
    }

    legacy_pip = [*C.CONDA_RUN, B.ENV_LEGACY, "python", "-m", "pip"]

    yield {
        "name": "pip",
        "file_dep": [B.HISTORY_LEGACY, B.WHEEL],
        "targets": [B.PIP_FROZEN_LEGACY],
        "actions": [
            [*legacy_pip, "install", "--no-deps", "--ignore-installed", B.WHEEL],
            [*legacy_pip, "check"],
            (U.pip_list, [B.PIP_FROZEN_LEGACY, legacy_pip]),
        ],
    }

    yield from U.make_pytest_tasks(
        file_dep=[B.PIP_FROZEN_LEGACY],
        pytest_html=B.PYTEST_HTML_LEGACY,
        htmlcov=B.HTMLCOV_HTML_LEGACY,
        pytest_cov_xml=B.PYTEST_COV_XML_LEGACY,
    )

    yield from U.make_robot_tasks(lab_env=B.ENV_LEGACY, out_root=B.ROBOT_LEGACY)


def task_watch():
    yield {
        "name": "js",
        "actions": [["jlpm", "lerna", "run", "watch", "--stream", "--parallel"]],
        "file_dep": [B.YARN_INTEGRITY],
    }


def task_docs():
    yield {
        "name": "sphinx",
        "file_dep": [
            *P.DOCS_PY,
            *L.ALL_MD,
            *B.HISTORY,
            B.WHEEL,
            B.LITE_SHASUMS,
            *L.ALL_DOCS_STATIC,
        ],
        "actions": [["sphinx-build", "-b", "html", "docs", "build/docs"]],
        "targets": [B.DOCS_BUILDINFO],
    }


@doit.create_after("docs")
def task_check():
    all_html = [p for p in sorted(B.DOCS.rglob("*.html")) if U.should_check(p)]
    all_spell = [p for p in all_html if U.should_spell(p)]

    for example in P.EXAMPLES.glob("*.ipynb"):
        out_html = B.EXAMPLE_HTML / f"{example.name}.html"
        all_spell += [out_html]
        yield {
            "name": f"nbconvert:{example.name}",
            "actions": [
                (doit.tools.create_folder, [B.EXAMPLE_HTML]),
                ["jupyter", "nbconvert", "--to=html", "--output", out_html, example],
                (U.rewrite_links, [out_html]),
            ],
            "file_dep": [example],
            "targets": [out_html],
        }

    yield {
        "name": "links",
        "file_dep": [B.DOCS_BUILDINFO, *all_html],
        "actions": [
            [
                "pytest-check-links",
                "-vv",
                "--check-anchors",
                "--check-links-ignore",
                "http.*",
                *all_html,
            ],
        ],
    }

    extra_dict_lines = C.VERSION.split(".")

    yield {
        "name": "spelling:DICTIONARY",
        "file_dep": [P.DOCS_DICTIONARY],
        "targets": [B.DOCS_DICTIONARY],
        "uptodate": [doit.tools.config_changed({"extra": extra_dict_lines})],
        "actions": [
            (
                U.merge_spell_dictonaries,
                [B.DOCS_DICTIONARY, [P.DOCS_DICTIONARY], extra_dict_lines],
            ),
        ],
    }

    for html_path in all_spell:
        stem = html_path.relative_to(P.ROOT)
        report = B.SPELLING / f"{stem}.txt"
        yield {
            "name": f"spelling:{stem}",
            "actions": [
                (doit.tools.create_folder, [report.parent]),
                (U.check_one_spell, [B.DOCS_DICTIONARY, html_path, report]),
            ],
            "file_dep": [html_path, B.DOCS_DICTIONARY],
            "targets": [report],
        }


def task_dist():
    if E.TESTING_IN_CI:
        return

    def build_with_sde():
        import subprocess

        rc = subprocess.call(
            [
                "flit",
                "--debug",
                "build",
                "--setup-py",
                "--format=wheel",
                "--format=sdist",
            ],
            env=dict(**os.environ, SOURCE_DATE_EPOCH=U.source_date_epoch()),
        )
        return rc == 0

    yield {
        "name": "flit",
        "file_dep": [*L.ALL_PY_SRC, P.PYPROJECT_TOML, B.STATIC_PKG_JSON],
        "actions": [build_with_sde],
        "targets": [B.WHEEL, B.SDIST],
    }

    yield {
        "name": "npm",
        "file_dep": [
            B.JS_META_TSBUILDINFO,
            *P.ALL_PACKAGE_JSONS,
            P.EXT_JS_README,
            P.EXT_JS_LICENSE,
        ],
        "targets": [B.NPM_TARBALL],
        "actions": [
            (doit.tools.create_folder, [B.DIST]),
            U.do(["npm", "pack", P.EXT_JS_PKG], cwd=B.DIST),
        ],
    }

    yield {
        "name": "hash",
        "file_dep": [*B.DIST_HASH_DEPS],
        "targets": [B.DIST_SHASUMS],
        "actions": [(U.hash_files, [B.DIST_SHASUMS, *B.DIST_HASH_DEPS])],
    }


def task_dev():
    if E.TESTING_IN_CI:
        ci_artifact = B.WHEEL if sys.version_info < (3, 8) else B.SDIST
        pip_args = [ci_artifact]
        py_dep = [ci_artifact]
    else:
        py_dep = [B.STATIC_PKG_JSON]
        pip_args = [
            "-e",
            ".",
            "--ignore-installed",
            "--no-deps",
            "--no-build-isolation",
            "--disable-pip-version-check",
        ]
        yield {
            "name": "ext",
            "actions": [
                ["python", P.SCRIPT_LABEXT, "develop", "--debug", "--overwrite", "."],
            ],
            "file_dep": [
                B.STATIC_PKG_JSON,
                *P.ALL_PLUGIN_SCHEMA,
                P.SCRIPT_LABEXT,
                B.PIP_FROZEN,
            ],
            "targets": [B.ENV_PKG_JSON],
        }

    check = []

    if not E.IN_RTD:
        # avoid sphinx-rtd-theme
        check = [[sys.executable, "-m", "pip", "check"]]

    yield {
        "name": "pip",
        "file_dep": py_dep,
        "targets": [B.PIP_FROZEN],
        "actions": [
            [sys.executable, "-m", "pip", "install", "-vv", *pip_args],
            *check,
            U.pip_list,
        ],
    }


def task_test():
    file_dep = [B.PIP_FROZEN]

    if not E.TESTING_IN_CI:
        file_dep += [B.STATIC_PKG_JSON, *L.ALL_PY_SRC]

    yield from U.make_pytest_tasks(
        file_dep=file_dep,
        pytest_html=B.PYTEST_HTML,
        htmlcov=B.HTMLCOV_HTML,
        pytest_cov_xml=B.PYTEST_COV_XML,
    )

    yield from U.make_robot_tasks(lab_env=B.ENV, out_root=B.ROBOT_LATEST)


@doit.create_after("test")
def task_report():
    if E.WITH_JS_COV:
        yield {
            "name": "nyc",
            "targets": [B.REPORTS_NYC_LCOV],
            "uptodate": [lambda: False],
            "actions": [(U.run_nyc, [B.ROBOT])],
        }


def task_lint():
    version_uptodate = doit.tools.config_changed({"version": C.VERSION})

    pkg_json_tasks = []

    for pkg_json in P.ALL_PACKAGE_JSONS:
        path = pkg_json.parent.relative_to(P.ROOT)
        name = f"js:{C.PACKAGE_JSON}:{path}"
        pkg_json_tasks += [f"lint:{name}"]
        yield {
            "name": name,
            "file_dep": [pkg_json, B.YARN_INTEGRITY],
            "actions": [["jlpm", "prettier-package-json", "--write", *U.rel(pkg_json)]],
        }

    yield {
        "name": "js:prettier",
        "file_dep": [*L.ALL_PRETTIER, B.YARN_INTEGRITY],
        "task_dep": pkg_json_tasks,
        "actions": [
            [
                "jlpm",
                "stylelint",
                "--fix",
                "--cache",
                "--cache-location",
                B.STYLELINT_CACHE,
                *U.rel(*L.ALL_CSS),
            ],
            [
                "jlpm",
                "prettier",
                "--write",
                "--list-different",
                *U.rel(*L.ALL_PRETTIER),
            ],
        ],
    }

    yield {
        "name": "js:eslint",
        "task_dep": ["lint:js:prettier"],
        "file_dep": [*L.ALL_TS, *P.ALL_PACKAGE_JSONS, B.YARN_INTEGRITY],
        "actions": [
            [
                "jlpm",
                "eslint",
                "--cache",
                "--cache-location",
                *U.rel(B.BUILD / ".eslintcache"),
                "--ext",
                ".js,.jsx,.ts,.tsx",
                *([] if E.IN_CI else ["--fix"]),
                *U.rel(P.JS),
            ],
        ],
    }

    yield {
        "name": "version:py",
        "uptodate": [version_uptodate],
        "file_dep": [P.PYPROJECT_TOML],
        "actions": [(U.ensure_version, [P.PYPROJECT_TOML])],
    }

    check = ["--check"] if E.IN_CI else []
    rel_ruff = U.rel(*L.ALL_RUFF)
    yield {
        "name": "py:ruff",
        "file_dep": [*L.ALL_RUFF, *B.HISTORY, P.PYPROJECT_TOML],
        "task_dep": ["lint:version:py"],
        "actions": [
            ["ssort", *check, *rel_ruff],
            ["ruff", "--fix-only", *rel_ruff],
            ["ruff", "format", *check, *rel_ruff],
        ],
    }

    yield {
        "name": "robot:tidy",
        "file_dep": [*L.ALL_ROBOT, *B.HISTORY],
        "actions": [["robotidy", *U.rel(P.ATEST)]],
    }

    yield {
        "name": "robot:cop",
        "task_dep": ["lint:robot:tidy"],
        "file_dep": [*L.ALL_ROBOT, *B.HISTORY],
        "actions": [["robocop", *U.rel(P.ATEST)]],
    }

    yield from U.make_robot_tasks(
        lab_env=B.ENV,
        out_root=B.ROBOT_LATEST,
        extra_args=[C.ROBOT_DRYRUN],
    )


def task_build():
    for dest in [P.EXT_JS_README, P.EXT_JS_LICENSE]:
        src = P.ROOT / dest.name
        yield {
            "name": f"meta:js:{dest.name}",
            "file_dep": [src],
            "actions": [(U.copy_one, [src, dest])],
            "targets": [dest],
        }

    uptodate = [doit.tools.config_changed({"WITH_JS_COV": E.WITH_JS_COV})]

    ext_dep = [
        *P.JS_PACKAGE_JSONS,
        P.EXT_JS_WEBPACK,
        *L.ALL_CSS_SRC,
        *L.ALL_TS,
        *L.ALL_CSS_SRC,
    ]

    if E.WITH_JS_COV:
        ext_task = "labextension:build:cov"
    else:
        ext_task = "labextension:build"
        ext_dep += [B.JS_META_TSBUILDINFO]
        yield {
            "uptodate": uptodate,
            "name": "js",
            "actions": [["jlpm", "lerna", "run", "build"]],
            "file_dep": [*L.ALL_TS, B.YARN_INTEGRITY],
            "targets": [B.JS_META_TSBUILDINFO],
        }

    yield {
        "uptodate": uptodate,
        "name": "ext",
        "actions": [["jlpm", "lerna", "run", ext_task]],
        "file_dep": ext_dep,
        "targets": [B.STATIC_PKG_JSON],
    }


def task_site():
    yield {
        "name": "build",
        "file_dep": [
            P.PAGES_LITE_CONFIG,
            P.PAGES_LITE_JSON,
            B.ENV_PKG_JSON,
            B.ROBOT_LOG_HTML,
            B.PIP_FROZEN,
        ],
        "targets": [B.PAGES_LITE_SHASUMS],
        "actions": [
            U.do(
                ["jupyter", "lite", "--debug", "build"],
                cwd=P.PAGES_LITE,
            ),
            U.do(
                ["jupyter", "lite", "doit", "--", "pre_archive:report:SHA256SUMS"],
                cwd=P.PAGES_LITE,
            ),
        ],
    }


def task_lite():
    yield {
        "name": "build",
        "file_dep": [
            P.LITE_CONFIG,
            P.LITE_JSON,
            B.ENV_PKG_JSON,
            *P.ALL_EXAMPLES,
            B.PIP_FROZEN,
        ],
        "targets": [B.LITE_SHASUMS],
        "actions": [
            U.do(
                ["jupyter", "lite", "--debug", "build"],
                cwd=P.EXAMPLES,
            ),
            U.do(
                ["jupyter", "lite", "doit", "--", "pre_archive:report:SHA256SUMS"],
                cwd=P.EXAMPLES,
            ),
        ],
    }


def task_serve():
    yield {
        "name": "lab",
        "uptodate": [lambda: False],
        "file_dep": [B.ENV_PKG_JSON, B.PIP_FROZEN],
        "actions": [doit.tools.PythonInteractiveAction(U.lab, [B.ENV])],
    }

    yield {
        "name": "docs",
        "uptodate": [lambda: False],
        "file_dep": [B.DOCS_BUILDINFO],
        "actions": [
            doit.tools.LongRunning(
                ["python", "-m", "http.server", "-b", "127.0.0.1"],
                shell=False,
                cwd=str(B.DOCS),
            ),
        ],
    }

    yield {
        "name": "lab:legacy",
        "uptodate": [lambda: False],
        "file_dep": [B.PIP_FROZEN_LEGACY],
        "actions": [doit.tools.PythonInteractiveAction(U.lab, [B.ENV_LEGACY])],
    }


# otherwise it goes.... somewhere
{
    os.environ.update({k: f"{v}"})
    for k, v in {
        "JUPYTER_PLATFORM_DIRS": 1,
        "MOZ_HEADLESS": E.MOZ_HEADLESS,
        "NX_CACHE_DIRECTORY": P.ROOT / "build/.cache/nx",
        "NX_PROJECT_GRAPH_CACHE_DIRECTORY": P.ROOT / "build/.cache/nx-graph",
        "PYDEVD_DISABLE_FILE_VALIDATION": 1,
    }.items()
    if k not in os.environ
}

if dotenv_loaded:
    os.environ.update(dotenv_loaded)
