"""automation for jupyterlab-deck"""
import json
import os
from pathlib import Path

import doit.tools


class P:
    DODO = Path(__file__)
    ROOT = DODO.parent
    BINDER = ROOT / ".binder"
    ENV_YAML = BINDER / "environment.yml"
    YARNRC = ROOT / ".yarnrc"
    YARN_LOCK = ROOT / "yarn.lock"
    JS = ROOT / "js"
    JS_META = JS / "_meta"
    JS_PACKAGE_JSONS = [*JS.glob("*/package.json")]
    ALL_PACKAGE_JSONS = [*JS_PACKAGE_JSONS, ROOT / "package.json"]
    JS_TS_INFO = [*JS.glob("*/tsconfig.json"), *JS.glob("*/src/tsconfig.json")]
    EXT_JS_PKG = JS / "jupyterlab-deck"
    PY_SRC = ROOT / "src/jupyterlab_deck"
    PYPROJECT_TOML = ROOT / "pyproject.toml"
    DOCS = ROOT / "docs"
    DOCS_STATIC = DOCS / "_static"
    DOCS_PY = [*DOCS.glob("*.py")]
    EXAMPLES = ROOT / "examples"
    LITE_JSON = EXAMPLES / "jupyter-lite.json"
    LITE_CONFIG = EXAMPLES / "jupyter_lite_config.json"
    CI = ROOT / ".github"


class E:
    IN_CI = bool(json.loads(os.environ.get("CI", "false").lower()))
    IN_RTD = bool(json.loads(os.environ.get("READTHEDOCS", "False").lower()))
    IN_BINDER = bool(json.loads(os.environ.get("IN_BINDER", "0")))
    LOCAL = not (IN_BINDER or IN_CI or IN_RTD)


class B:
    ENV = P.ROOT / ".venv"
    HISTORY = [ENV / "conda-meta/history"] if E.LOCAL else []
    NODE_MODULES = P.ROOT / "node_modules"
    YARN_INTEGRITY = NODE_MODULES / ".yarn-integrity"
    JS_META_TSBUILDINFO = P.JS_META / ".src.tsbuildinfo"
    BUILD = P.ROOT / "build"
    DIST = P.ROOT / "dist"
    DOCS = BUILD / "docs"
    DOCS_BUILDINFO = DOCS / ".buildinfo"
    LITE = BUILD / "lite"
    STATIC = P.PY_SRC / "_d/share/jupyter/labextensions/@deathbeds/jupyterlab-deck"
    STATIC_PKG_JSON = STATIC / "package.json"
    WHEEL = DIST / "jupyterlab_deck-0.1.0a0-py3-none-any.whl"
    LITE_SHASUMS = LITE / "SHA256SUMS"
    STYLELINT_CACHE = BUILD / ".stylelintcache"
    NPM_TARBALL = DIST / "deathbeds-jupyterlab-deck-0.1.0-alpha.0.tgz"


class L:
    ALL_DOCS_MD = [*P.DOCS.rglob("*.md")]
    ALL_PY_SRC = [*P.PY_SRC.rglob("*.py")]
    ALL_BLACK = [P.DODO, *ALL_PY_SRC, *P.DOCS_PY]
    ALL_CSS = [*P.DOCS_STATIC.rglob("*.css"), *P.JS.glob("*/style/**/*.css")]
    ALL_JSON = [
        *P.ROOT.glob(".json"),
        *P.JS.glob("*.json"),
        *P.JS.glob("*/src/**/*.json"),
        *P.JS.glob("*/src/schema/*.json"),
    ]
    ALL_MD = [*P.ROOT.glob("*.md")]
    ALL_TS = [*P.JS.glob("*/src/**/*.ts"), *P.JS.glob("*/src/**/*.tsx")]
    ALL_YML = [*P.BINDER.glob("*.yml"), *P.CI.glob("*.yml")]
    ALL_PRETTIER = [*ALL_JSON, *ALL_MD, *ALL_YML, *ALL_TS]


def task_setup():
    if E.LOCAL:
        yield dict(
            name="conda",
            file_dep=[P.ENV_YAML],
            targets=[*B.HISTORY],
            actions=[
                ["mamba", "env", "update", "--prefix", B.ENV, "--file", P.ENV_YAML]
            ],
        )

    yield dict(
        name="yarn",
        file_dep=[
            P.YARNRC,
            *B.HISTORY,
            *P.ALL_PACKAGE_JSONS,
            *([P.YARN_LOCK] if P.YARN_LOCK.exists() else []),
        ],
        actions=[["jlpm"], ["jlpm", "yarn-deduplicate", "-s", "fewer", "--fail"]],
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
        file_dep=[*P.DOCS_PY, *L.ALL_DOCS_MD, *B.HISTORY, B.WHEEL, B.LITE_SHASUMS],
        actions=[["sphinx-build", "-b", "html", "docs", "build/docs"]],
        targets=[B.DOCS_BUILDINFO],
    )


class U:
    def do(args, **kwargs):
        cwd = kwargs.pop("cwd", P.ROOT)
        shell = kwargs.pop("shell", False)
        return doit.tools.CmdAction(args, shell=shell, cwd=cwd, **kwargs)

    def source_date_epoch():
        import subprocess

        return (
            subprocess.check_output(["git", "log", "-1", "--format=%ct"])
            .decode("utf-8")
            .strip()
        )


def task_dist():
    def build_with_sde():
        import subprocess

        rc = subprocess.call(
            ["flit", "--debug", "build", "--setup-py"],
            env=dict(**os.environ, SOURCE_DATE_EPOCH=U.source_date_epoch()),
        )
        return rc == 0

    yield dict(
        name="flit",
        file_dep=[*L.ALL_PY_SRC, P.PYPROJECT_TOML, B.STATIC_PKG_JSON],
        actions=[build_with_sde],
        targets=[B.WHEEL],
    )

    yield dict(
        name="npm",
        file_dep=[B.JS_META_TSBUILDINFO, *P.ALL_PACKAGE_JSONS],
        targets=[B.NPM_TARBALL],
        actions=[U.do(["npm", "pack", P.EXT_JS_PKG], cwd=B.DIST)],
    )


def task_dev():
    yield dict(
        name="ext",
        actions=[
            ["jupyter", "labextension", "develop", "--overwrite", "."],
        ],
    )
    yield dict(
        name="py",
        actions=[
            [
                "python",
                "-m",
                "pip",
                "install",
                "-e",
                ".",
                "--ignore-installed",
                "--no-deps",
            ],
        ],
    )


def task_lint():
    pkg_json_tasks = []
    for pkg_json in P.ALL_PACKAGE_JSONS:
        name = f"package.json:{pkg_json.parent.relative_to(P.ROOT)}"
        pkg_json_tasks += [f"lint:{name}"]
        yield dict(
            name=name,
            file_dep=[pkg_json, B.YARN_INTEGRITY],
            actions=[["jlpm", "prettier-package-json", "--write", pkg_json]],
        )

    yield dict(
        name="prettier",
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
                *L.ALL_CSS,
            ],
            ["jlpm", "prettier", "--write", "--list-different", *L.ALL_PRETTIER],
        ],
    )

    yield dict(
        name="black",
        file_dep=[*L.ALL_BLACK, *B.HISTORY],
        actions=[
            ["isort", *L.ALL_BLACK],
            ["ssort", *L.ALL_BLACK],
            ["black", *L.ALL_BLACK],
        ],
    )


def task_build():
    yield dict(
        name="js",
        actions=[["jlpm", "lerna", "run", "build"]],
        file_dep=[*L.ALL_TS, B.YARN_INTEGRITY],
        targets=[B.JS_META_TSBUILDINFO],
    )
    yield dict(
        name="ext",
        actions=[["jlpm", "lerna", "run", "labextension:build"]],
        file_dep=[B.JS_META_TSBUILDINFO, *P.JS_PACKAGE_JSONS],
        targets=[B.STATIC_PKG_JSON],
    )


def task_lite():

    yield dict(
        name="build",
        file_dep=[B.WHEEL, P.LITE_CONFIG, P.LITE_JSON, B.STATIC_PKG_JSON],
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
        task_dep=["dev"],
        actions=[doit.tools.PythonInteractiveAction(lab)],
    )
