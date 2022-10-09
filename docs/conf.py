"""documentation for jupyterlab-deck"""
import datetime
import json
import os
import subprocess
from pathlib import Path

import tomli

os.environ.update(IN_SPHINX="1")

CONF_PY = Path(__file__)
HERE = CONF_PY.parent
ROOT = HERE.parent
PYPROJ = ROOT / "pyproject.toml"
PROJ_DATA = tomli.loads(PYPROJ.read_text(encoding="utf-8"))
RTD = json.loads(os.environ.get("READTHEDOCS", "False").lower())

# metadata
author = PROJ_DATA["project"]["authors"][0]["name"]
project = PROJ_DATA["project"]["name"]
copyright = f"{datetime.date.today().year}, {author}"

# The full version, including alpha/beta/rc tags
release = PROJ_DATA["project"]["version"]

# The short X.Y version
version = ".".join(release.rsplit(".", 1))

# sphinx config
extensions = [
    "sphinx.ext.autosectionlabel",
    "myst_nb",
    "sphinx_copybutton",
]

autosectionlabel_prefix_document = True
myst_heading_anchors = 3
suppress_warnings = ["autosectionlabel.*"]

# files
# rely on the order of these to patch json, labextensions correctly
html_static_path = [
    # docs stuff
    "_static",
    # as-built application
    "../build/lite",
]
html_css_files = [
    "theme.css",
]

exclude_patterns = [
    "_build",
    ".ipynb_checkpoints",
    "**/.ipynb_checkpoints",
    "**/~.*",
    "**/node_modules",
    "babel.config.*",
    "jest-setup.js",
    "jest.config.js",
    "jupyter_execute",
    ".jupyter_cache",
    "test/",
    "tsconfig.*",
    "webpack.config.*",
]

# theme
html_theme = "pydata_sphinx_theme"
html_favicon = "_static/deck.svg"
html_logo = "_static/deck.svg"
html_theme_options = {
    "github_url": PROJ_DATA["project"]["urls"]["Source"],
    "use_edit_page_button": True,
    "logo": dict(text=PROJ_DATA["project"]["name"]),
}

html_context = {
    "github_user": "deathbeds",
    "github_repo": "jupyterlab-deck",
    "github_version": "main",
    "doc_path": "docs",
}

html_sidebars = {"**": []}


def setup(app):
    subprocess.check_call(["doit", "lite"], cwd=ROOT)
