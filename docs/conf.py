"""documentation for jupyterlab-deck."""
import datetime
from pathlib import Path

import tomli

IGNORED_MESSAGES = [
    # thrown with `---` in places docutils doesn't like, but deck wants
    r"Document or section may not begin with a transition",
]


CONF_PY = Path(__file__)
HERE = CONF_PY.parent
ROOT = HERE.parent
PYPROJ = ROOT / "pyproject.toml"
PROJ_DATA = tomli.loads(PYPROJ.read_text(encoding="utf-8"))

# metadata
author = PROJ_DATA["project"]["authors"][0]["name"]
project = PROJ_DATA["project"]["name"]
copyright = f"{datetime.datetime.now(tz=datetime.timezone.utc).date().year}, {author}"

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
    "logo": {"text": PROJ_DATA["project"]["name"]},
    "icon_links": [
        {
            "name": "PyPI",
            "url": "https://pypi.org/project/jupyterlab-deck",
            "icon": "fa-brands fa-python",
        },
        {
            "name": "conda-forge",
            "url": "https://github.com/conda-forge/jupyterlab-deck-feedstock#about-jupyterlab-deck",
            "icon": "_static/anvil.svg",
            "type": "local",
        },
        {
            "name": "npm",
            "url": "https://www.npmjs.com/package/@deathbeds/jupyterlab-deck",
            "icon": "fa-brands fa-npm",
        },
    ],
    # rely on browser-native accessibility features instead of custom JS
    "navigation_with_keys": False,
}

html_context = {
    "github_user": "deathbeds",
    "github_repo": "jupyterlab-deck",
    "github_version": "main",
    "doc_path": "docs",
}

html_sidebars = {"**": []}


def setup(app):
    """Perform startup things before sphinx runs."""
    import re

    from docutils.utils import Reporter

    _old_system_message = Reporter.system_message

    def _filtered_system_message(self, lvl, msg, *args, **kwargs):
        """Don't allow sphinx to warn on known issues."""
        if any(re.search(pat, msg) is not None for pat in IGNORED_MESSAGES):
            return None
        return _old_system_message(lvl, msg, *args, **kwargs)

    Reporter.system_message = _filtered_system_message
