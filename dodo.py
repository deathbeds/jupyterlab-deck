"""automation for jupyterlab-deck"""
import json
import os
import platform
import shutil
import subprocess
import sys
import time
import typing
from pathlib import Path

import doit.tools


class C:
    NPM_NAME = "@deathbeds/jupyterlab-deck"
    OLD_VERSION = "0.1.1"
    VERSION = "0.1.2"
    PACKAGE_JSON = "package.json"
    PYPROJECT_TOML = "pyproject.toml"
    PABOT_DEFAULTS = [
        "--artifactsinsubfolders",
        "--artifacts",
        "png,log,txt,svg,ipynb,json",
    ]
    PLATFORM = platform.system()
    PY_VERSION = "{}.{}".format(sys.version_info[0], sys.version_info[1])
    ROBOT_DRYRUN = "--dryrun"
    NYC = ["jlpm", "nyc", "report"]


class P:
    DODO = Path(__file__)
    ROOT = DODO.parent
    BINDER = ROOT / ".binder"
    DOCS = ROOT / "docs"
    CI = ROOT / ".github"
    DEMO_ENV_YAML = BINDER / "environment.yml"
    TEST_ENV_YAML = CI / "environment-test.yml"
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
        LINT_ENV_YAML: [BASE_ENV_YAML, BUILD_ENV_YAML, ROBOT_ENV_YAML],
    }
    YARNRC = ROOT / ".yarnrc"
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
    PY_SRC = ROOT / "src/jupyterlab_deck"
    PYPROJECT_TOML = ROOT / C.PYPROJECT_TOML
    DOCS_STATIC = DOCS / "_static"
    DOCS_PY = [*DOCS.glob("*.py")]
    EXAMPLES = ROOT / "examples"
    LITE_JSON = EXAMPLES / "jupyter-lite.json"
    LITE_CONFIG = EXAMPLES / "jupyter_lite_config.json"
    ALL_EXAMPLE_IPYNB = [*EXAMPLES.rglob("*.ipynb")]
    ALL_EXAMPLES = [*EXAMPLES.rglob("*.md"), *ALL_EXAMPLE_IPYNB]
    PAGES_LITE = ROOT / "pages-lite"
    PAGES_LITE_CONFIG = PAGES_LITE / "jupyter_lite_config.json"
    PAGES_LITE_JSON = PAGES_LITE / "jupyter-lite.json"
    ESLINTRC = JS / ".eslintrc.js"
    ALL_PLUGIN_SCHEMA = [*JS.glob("*/schmea/*.json")]
    ATEST = ROOT / "atest"
    ROBOT_SUITES = ATEST / "suites"


class E:
    IN_CI = bool(json.loads(os.environ.get("CI", "false").lower()))
    BUILDING_IN_CI = bool(json.loads(os.environ.get("BUILDING_IN_CI", "false").lower()))
    TESTING_IN_CI = bool(json.loads(os.environ.get("TESTING_IN_CI", "false").lower()))
    IN_RTD = bool(json.loads(os.environ.get("READTHEDOCS", "False").lower()))
    IN_BINDER = bool(json.loads(os.environ.get("IN_BINDER", "0")))
    LOCAL = not (IN_BINDER or IN_CI or IN_RTD)
    ROBOT_RETRIES = json.loads(os.environ.get("ROBOT_RETRIES", "0"))
    ROBOT_ARGS = json.loads(os.environ.get("ROBOT_ARGS", "[]"))
    WITH_JS_COV = bool(json.loads(os.environ.get("WITH_JS_COV", "0")))


class B:
    ENV = P.ROOT / ".venv" if E.LOCAL else Path(sys.prefix)
    HISTORY = [ENV / "conda-meta/history"] if E.LOCAL else []
    NODE_MODULES = P.ROOT / "node_modules"
    YARN_INTEGRITY = NODE_MODULES / ".yarn-integrity"
    JS_META_TSBUILDINFO = P.JS_META / ".src.tsbuildinfo"
    BUILD = P.ROOT / "build"
    DIST = P.ROOT / "dist"
    DOCS = BUILD / "docs"
    DOCS_BUILDINFO = DOCS / ".buildinfo"
    LITE = BUILD / "lite"
    STATIC = P.PY_SRC / f"_d/share/jupyter/labextensions/{C.NPM_NAME}"
    STATIC_PKG_JSON = STATIC / C.PACKAGE_JSON
    WHEEL = DIST / f"jupyterlab_deck-{C.VERSION}-py3-none-any.whl"
    SDIST = DIST / f"jupyterlab-deck-{C.VERSION}.tar.gz"
    LITE_SHASUMS = LITE / "SHA256SUMS"
    STYLELINT_CACHE = BUILD / ".stylelintcache"
    NPM_TARBALL = DIST / f"deathbeds-jupyterlab-deck-{C.VERSION}.tgz"
    DIST_HASH_DEPS = [NPM_TARBALL, WHEEL, SDIST]
    DIST_SHASUMS = DIST / "SHA256SUMS"
    ENV_PKG_JSON = ENV / f"share/jupyter/labextensions/{C.NPM_NAME}/{C.PACKAGE_JSON}"
    PIP_FROZEN = BUILD / "pip-freeze.txt"
    REPORTS = BUILD / "reports"
    ROBOCOV = BUILD / "__robocov__"
    REPORTS_NYC = REPORTS / "nyc"
    REPORTS_NYC_LCOV = REPORTS_NYC / "lcov.info"
    REPORTS_COV_XML = REPORTS / "coverage-xml"
    PYTEST_HTML = REPORTS / "pytest.html"
    PYTEST_COV_XML = REPORTS_COV_XML / "pytest.coverage.xml"
    HTMLCOV_HTML = REPORTS / "htmlcov/index.html"
    ROBOT = REPORTS / "robot"
    ROBOT_SCREENSHOTS = ROBOT / "screenshots"
    ROBOT_LOG_HTML = ROBOT / "log.html"
    PAGES_LITE = BUILD / "pages-lite"
    PAGES_LITE_SHASUMS = PAGES_LITE / "SHA256SUMS"


class L:
    ALL_DOCS_MD = [*P.DOCS.rglob("*.md")]
    ALL_PY_SRC = [*P.PY_SRC.rglob("*.py")]
    ALL_BLACK = [P.DODO, *ALL_PY_SRC, *P.DOCS_PY]
    ALL_CSS = [*P.DOCS_STATIC.rglob("*.css"), *P.JS.glob("*/style/**/*.css")]
    ALL_JSON = [
        *P.ROOT.glob(".json"),
        *P.JS.glob("*.json"),
        *P.JS.glob("*/src/**/*.json"),
        *P.ALL_PLUGIN_SCHEMA,
    ]
    ALL_MD = [
        *P.ROOT.glob("*.md"),
        *P.DOCS.rglob("*.md"),
        *P.CI.rglob("*.md"),
        *P.EXAMPLES.glob("*.md"),
    ]
    ALL_TS = [*P.JS.glob("*/src/**/*.ts"), *P.JS.glob("*/src/**/*.tsx")]
    ALL_YML = [*P.BINDER.glob("*.yml"), *P.CI.rglob("*.yml"), *P.ROOT.glob("*.yml")]
    ALL_JS = [*P.JS.glob("*.js")]
    ALL_PRETTIER = [*ALL_JSON, *ALL_MD, *ALL_YML, *ALL_TS, *ALL_JS, *ALL_CSS]
    ALL_ROBOT = [*P.ATEST.rglob("*.robot"), *P.ATEST.rglob("*.resource")]


class U:
    def do(args, **kwargs):
        cwd = kwargs.pop("cwd", P.ROOT)
        shell = kwargs.pop("shell", False)
        return doit.tools.CmdAction(args, shell=shell, cwd=cwd, **kwargs)

    def source_date_epoch():
        return (
            subprocess.check_output(["git", "log", "-1", "--format=%ct"])
            .decode("utf-8")
            .strip()
        )

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

    def pip_list():
        B.PIP_FROZEN.write_bytes(
            subprocess.check_output([sys.executable, "-m", "pip", "freeze"])
        )

    def copy_one(src, dest):
        if not dest.parent.exists():
            dest.parent.mkdir(parents=True)
        if dest.exists():
            dest.unlink()
        shutil.copy2(src, dest)

    def copy_some(dest, srcs):
        for src in srcs:
            U.copy_one(src, dest / src.name)

    def clean_some(*paths):

        for path in paths:
            if path.is_dir():
                shutil.rmtree(path)
            elif path.exists():
                path.unlink()

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
                ]
            )
        dest_env.write_text(dest_text.strip() + "\n")

    def make_robot_tasks(extra_args=None):
        extra_args = extra_args or []
        name = "robot"
        file_dep = [*B.HISTORY, *L.ALL_ROBOT]
        if C.ROBOT_DRYRUN in extra_args:
            name = f"{name}:dryrun"
        else:
            file_dep += [B.PIP_FROZEN, *L.ALL_PY_SRC, *L.ALL_TS, *L.ALL_JSON]
        out_dir = B.ROBOT / U.get_robot_stem(attempt=1, extra_args=extra_args)
        targets = [
            out_dir / "output.xml",
            out_dir / "log.html",
            out_dir / "report.html",
        ]
        actions = []
        if E.WITH_JS_COV and C.ROBOT_DRYRUN not in extra_args:
            targets += [B.REPORTS_NYC_LCOV]
            actions += [
                (U.clean_some, [B.ROBOCOV, B.REPORTS_NYC]),
                (doit.tools.create_folder, [B.ROBOCOV]),
            ]
        yield dict(
            name=name,
            uptodate=[
                doit.tools.config_changed(dict(cov=E.WITH_JS_COV, args=E.ROBOT_ARGS))
            ],
            file_dep=file_dep,
            actions=[*actions, (U.run_robot_with_retries, [extra_args])],
            targets=targets,
        )

    def run_robot_with_retries(extra_args=None):
        attempt = 0
        fail_count = -1
        extra_args = [*(extra_args or []), *E.ROBOT_ARGS]

        retries = E.ROBOT_RETRIES

        while fail_count != 0 and attempt <= retries:
            attempt += 1
            print("attempt {} of {}...".format(attempt, retries + 1), flush=True)
            start_time = time.time()
            fail_count = U.run_robot(attempt=attempt, extra_args=extra_args)
            print(
                fail_count,
                "failed in",
                int(time.time() - start_time),
                "seconds",
                flush=True,
            )

        if fail_count == 0 and E.WITH_JS_COV and C.ROBOT_DRYRUN not in extra_args:
            if not [*B.ROBOCOV.glob("*.json")]:
                print(f"did not generate any coverage files in {B.ROBOCOV}")
                fail_count = -2
            else:

                subprocess.call(
                    [*C.NYC, f"--report-dir={B.REPORTS_NYC}", f"--temp-dir={B.ROBOCOV}"]
                )

        final = B.ROBOT / "output.xml"

        all_robot = [
            str(p)
            for p in B.ROBOT.rglob("output.xml")
            if p != final and "dry_run" not in str(p) and "pabot_results" not in str(p)
        ]

        subprocess.call(
            [
                "python",
                "-m",
                "robot.rebot",
                "--name",
                "🃏",
                "--nostatusrc",
                "--merge",
                *all_robot,
            ],
            cwd=B.ROBOT,
        )

        if B.ROBOT_SCREENSHOTS.exists():
            shutil.rmtree(B.ROBOT_SCREENSHOTS)

        B.ROBOT_SCREENSHOTS.mkdir()

        for screen_root in B.ROBOT.glob("*/screenshots/*"):
            shutil.copytree(screen_root, B.ROBOT_SCREENSHOTS / screen_root.name)

        return fail_count == 0

    def get_robot_stem(attempt=0, extra_args=None, browser="headlessfirefox"):
        """get the directory in B.ROBOT for this platform/app"""
        extra_args = extra_args or []

        browser = browser.replace("headless", "")

        stem = f"{C.PLATFORM[:3].lower()}_{C.PY_VERSION}_{browser}_{attempt}"

        if C.ROBOT_DRYRUN in extra_args:
            stem = "dry_run"

        return stem

    def run_robot(attempt=0, extra_args=None):
        import lxml.etree as ET

        extra_args = extra_args or []

        stem = U.get_robot_stem(attempt=attempt, extra_args=extra_args)
        out_dir = B.ROBOT / stem

        if attempt > 1:
            extra_args += ["--loglevel", "TRACE"]
            prev_stem = U.get_robot_stem(attempt=attempt - 1, extra_args=extra_args)
            previous = B.ROBOT / prev_stem / "output.xml"
            if previous.exists():
                extra_args += ["--rerunfailed", str(previous)]

        runner = ["pabot", *C.PABOT_DEFAULTS]

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
            *(["--variable", f"ROBOCOV:{B.ROBOCOV}"]),
            *(["--variable", f"ROOT:{P.ROOT}"]),
            # files
            *(["--xunit", out_dir / "xunit.xml"]),
            *(["--outputdir", out_dir]),
            # dynamic
            *extra_args,
        ]

        if out_dir.exists():
            print(">>> trying to clean out {}".format(out_dir), flush=True)
            try:
                shutil.rmtree(out_dir)
            except Exception as err:
                print(
                    "... error, hopefully harmless: {}".format(err),
                    flush=True,
                )

        if not out_dir.exists():
            print(
                ">>> trying to prepare output directory: {}".format(out_dir), flush=True
            )
            try:
                out_dir.mkdir(parents=True)
            except Exception as err:
                print(
                    "... Error, hopefully harmless: {}".format(err),
                    flush=True,
                )

        str_args = [
            *map(
                str,
                [
                    *args,
                    P.ROBOT_SUITES,
                ],
            )
        ]
        print(">>> ", " ".join(str_args), flush=True)

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

    def rel(*paths):
        return [p.relative_to(P.ROOT) for p in paths]


def task_env():
    for env_dest, env_src in P.ENV_INHERIT.items():
        yield dict(
            name=f"conda:{env_dest.name}",
            targets=[env_dest],
            file_dep=[*env_src],
            actions=[(U.update_env_fragments, [env_dest, env_src])],
        )


def task_setup():
    if E.TESTING_IN_CI:
        return

    dedupe = []
    if E.LOCAL:
        dedupe = [["jlpm", "yarn-deduplicate", "-s", "fewer", "--fail"]]
        yield dict(
            name="conda",
            file_dep=[P.DEMO_ENV_YAML],
            targets=[*B.HISTORY],
            actions=[
                ["mamba", "env", "update", "--prefix", B.ENV, "--file", P.DEMO_ENV_YAML]
            ],
        )

    if not (E.IN_CI and B.YARN_INTEGRITY.exists()):
        yield dict(
            name="yarn",
            file_dep=[
                P.YARNRC,
                *B.HISTORY,
                *P.ALL_PACKAGE_JSONS,
                *([P.YARN_LOCK] if P.YARN_LOCK.exists() else []),
            ],
            actions=[
                ["jlpm", *([] if E.LOCAL else ["--frozen-lockfile"])],
                *dedupe,
            ],
            targets=[B.YARN_INTEGRITY],
        )


def task_watch():
    yield dict(
        name="js",
        actions=[["jlpm", "lerna", "run", "watch", "--stream", "--parallel"]],
        file_dep=[B.YARN_INTEGRITY],
    )


def task_docs():
    yield dict(
        name="sphinx",
        file_dep=[*P.DOCS_PY, *L.ALL_MD, *B.HISTORY, B.WHEEL, B.LITE_SHASUMS],
        actions=[["sphinx-build", "-b", "html", "docs", "build/docs"]],
        targets=[B.DOCS_BUILDINFO],
    )


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

    yield dict(
        name="flit",
        file_dep=[*L.ALL_PY_SRC, P.PYPROJECT_TOML, B.STATIC_PKG_JSON],
        actions=[build_with_sde],
        targets=[B.WHEEL, B.SDIST],
    )

    yield dict(
        name="npm",
        file_dep=[
            B.JS_META_TSBUILDINFO,
            *P.ALL_PACKAGE_JSONS,
            P.EXT_JS_README,
            P.EXT_JS_LICENSE,
        ],
        targets=[B.NPM_TARBALL],
        actions=[
            (doit.tools.create_folder, [B.DIST]),
            U.do(["npm", "pack", P.EXT_JS_PKG], cwd=B.DIST),
        ],
    )

    yield dict(
        name="hash",
        file_dep=[*B.DIST_HASH_DEPS],
        targets=[B.DIST_SHASUMS],
        actions=[(U.hash_files, [B.DIST_SHASUMS, *B.DIST_HASH_DEPS])],
    )


def task_dev():
    if E.TESTING_IN_CI:
        ci_artifact = B.WHEEL if sys.version_info < (3, 8) else B.SDIST
        pip_args = [ci_artifact]
        py_dep = [ci_artifact]
    else:
        py_dep = [B.ENV_PKG_JSON]
        pip_args = [
            "-e",
            ".",
            "--ignore-installed",
            "--no-deps",
        ]
        yield dict(
            name="ext",
            actions=[
                ["jupyter", "labextension", "develop", "--overwrite", "."],
            ],
            file_dep=[B.STATIC_PKG_JSON, *P.ALL_PLUGIN_SCHEMA],
            targets=[B.ENV_PKG_JSON],
        )

    check = []

    if not E.IN_RTD:
        # avoid sphinx-rtd-theme
        check = [[sys.executable, "-m", "pip", "check"]]

    yield dict(
        name="py",
        file_dep=py_dep,
        targets=[B.PIP_FROZEN],
        actions=[
            [sys.executable, "-m", "pip", "install", "-vv", *pip_args],
            *check,
            (doit.tools.create_folder, [B.BUILD]),
            U.pip_list,
        ],
    )


def task_test():
    file_dep = [B.STATIC_PKG_JSON, *L.ALL_PY_SRC]

    if E.TESTING_IN_CI:
        file_dep = []

    yield dict(
        name="pytest",
        file_dep=[B.PIP_FROZEN, *file_dep],
        actions=[
            [
                "pytest",
                "--pyargs",
                P.PY_SRC.name,
                f"--cov={P.PY_SRC.name}",
                "--cov-branch",
                "--no-cov-on-fail",
                "--cov-fail-under=100",
                "--cov-report=term-missing:skip-covered",
                f"--cov-report=html:{B.HTMLCOV_HTML.parent}",
                f"--html={B.PYTEST_HTML}",
                "--self-contained-html",
                f"--cov-report=xml:{B.PYTEST_COV_XML}",
            ]
        ],
        targets=[B.PYTEST_HTML, B.HTMLCOV_HTML, B.PYTEST_COV_XML],
    )

    yield from U.make_robot_tasks()


def task_lint():
    version_uptodate = doit.tools.config_changed({"version": C.VERSION})

    pkg_json_tasks = []

    for pkg_json in P.ALL_PACKAGE_JSONS:
        path = pkg_json.parent.relative_to(P.ROOT)
        name = f"js:{C.PACKAGE_JSON}:{path}"
        pkg_json_tasks += [f"lint:{name}"]
        yield dict(
            uptodate=[version_uptodate],
            name=f"js:version:{path}",
            file_dep=[pkg_json],
            actions=[(U.ensure_version, [pkg_json])],
        )
        yield dict(
            name=name,
            task_dep=[f"lint:js:version:{path}"],
            file_dep=[pkg_json, B.YARN_INTEGRITY],
            actions=[["jlpm", "prettier-package-json", "--write", *U.rel(pkg_json)]],
        )

    yield dict(
        name="js:prettier",
        file_dep=[*L.ALL_PRETTIER, B.YARN_INTEGRITY],
        task_dep=pkg_json_tasks,
        actions=[
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
    )

    yield dict(
        name="js:eslint",
        task_dep=["lint:js:prettier"],
        file_dep=[*L.ALL_TS, P.ESLINTRC, B.YARN_INTEGRITY],
        actions=[
            [
                "jlpm",
                "eslint",
                "--cache",
                "--cache-location",
                *U.rel(B.BUILD / ".eslintcache"),
                "--config",
                *U.rel(P.ESLINTRC),
                "--ext",
                ".js,.jsx,.ts,.tsx",
                *([] if E.IN_CI else ["--fix"]),
                *U.rel(P.JS),
            ]
        ],
    )

    yield dict(
        name="version:py",
        uptodate=[version_uptodate],
        file_dep=[P.PYPROJECT_TOML],
        actions=[(U.ensure_version, [P.PYPROJECT_TOML])],
    )

    check = ["--check"] if E.IN_CI else []
    rel_black = U.rel(*L.ALL_BLACK)
    yield dict(
        name="py:black",
        file_dep=[*L.ALL_BLACK, *B.HISTORY, P.PYPROJECT_TOML],
        task_dep=["lint:version:py"],
        actions=[
            ["isort", *check, *rel_black],
            ["ssort", *check, *rel_black],
            ["black", *check, *rel_black],
        ],
    )

    yield dict(
        name="py:pyflakes",
        file_dep=[*L.ALL_BLACK, *B.HISTORY, P.PYPROJECT_TOML],
        task_dep=["lint:py:black"],
        actions=[["pyflakes", *rel_black]],
    )

    yield dict(
        name="robot:tidy",
        file_dep=[*L.ALL_ROBOT, *B.HISTORY],
        actions=[["robotidy", *U.rel(P.ATEST)]],
    )

    yield dict(
        name="robot:cop",
        task_dep=["lint:robot:tidy"],
        file_dep=[*L.ALL_ROBOT, *B.HISTORY],
        actions=[["robocop", *U.rel(P.ATEST)]],
    )

    yield from U.make_robot_tasks(extra_args=[C.ROBOT_DRYRUN])


def task_build():
    for dest in [P.EXT_JS_README, P.EXT_JS_LICENSE]:
        src = P.ROOT / dest.name
        yield dict(
            name=f"meta:js:{dest.name}",
            file_dep=[src],
            actions=[(U.copy_one, [src, dest])],
            targets=[dest],
        )

    uptodate = [doit.tools.config_changed(dict(WITH_JS_COV=E.WITH_JS_COV))]

    ext_dep = [*P.JS_PACKAGE_JSONS, P.EXT_JS_WEBPACK]

    if E.WITH_JS_COV:
        ext_task = "labextension:build:cov"
    else:
        ext_task = "labextension:build"
        ext_dep += [B.JS_META_TSBUILDINFO]
        yield dict(
            uptodate=uptodate,
            name="js",
            actions=[["jlpm", "lerna", "run", "build"]],
            file_dep=[*L.ALL_TS, B.YARN_INTEGRITY],
            targets=[B.JS_META_TSBUILDINFO],
        )

    yield dict(
        uptodate=uptodate,
        name="ext",
        actions=[["jlpm", "lerna", "run", ext_task]],
        file_dep=ext_dep,
        targets=[B.STATIC_PKG_JSON],
    )


def task_site():
    yield dict(
        name="build",
        file_dep=[
            P.PAGES_LITE_CONFIG,
            P.PAGES_LITE_JSON,
            B.ENV_PKG_JSON,
            B.ROBOT_LOG_HTML,
            B.PIP_FROZEN,
        ],
        targets=[B.PAGES_LITE_SHASUMS],
        actions=[
            U.do(
                ["jupyter", "lite", "--debug", "build"],
                cwd=P.PAGES_LITE,
            ),
            U.do(
                ["jupyter", "lite", "doit", "--", "pre_archive:report:SHA256SUMS"],
                cwd=P.PAGES_LITE,
            ),
        ],
    )


def task_lite():

    yield dict(
        name="build",
        file_dep=[
            P.LITE_CONFIG,
            P.LITE_JSON,
            B.ENV_PKG_JSON,
            *P.ALL_EXAMPLES,
            B.PIP_FROZEN,
        ],
        targets=[B.LITE_SHASUMS],
        actions=[
            U.do(
                ["jupyter", "lite", "--debug", "build"],
                cwd=P.EXAMPLES,
            ),
            U.do(
                ["jupyter", "lite", "doit", "--", "pre_archive:report:SHA256SUMS"],
                cwd=P.EXAMPLES,
            ),
        ],
    )


def task_serve():

    import subprocess

    def lab():
        proc = subprocess.Popen(
            list(map(str, ["jupyter", "lab", "--no-browser", "--debug"])),
            stdin=subprocess.PIPE,
        )

        try:
            proc.wait()
        except KeyboardInterrupt:
            print("attempting to stop lab, you may want to check your process monitor")
            proc.terminate()
            proc.communicate(b"y\n")

        proc.wait()
        return True

    yield dict(
        name="lab",
        uptodate=[lambda: False],
        file_dep=[B.ENV_PKG_JSON, B.PIP_FROZEN],
        actions=[doit.tools.PythonInteractiveAction(lab)],
    )
