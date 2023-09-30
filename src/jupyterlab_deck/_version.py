import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
_PKG_PATH = "share/jupyter/labextensions/@deathbeds/jupyterlab-deck/package.json"

_D = HERE.parent / "_d"

if _D.exists() and _D.parent.name == "src":  # pragma: no cover
    __prefix__ = _D.parent
    __package_json__ = _D / _PKG_PATH
    __js_src__ = "../" + __package_json__.parent.relative_to(_D.parent).as_posix()
else:  # pragma: no cover
    __prefix__ = Path(sys.prefix)
    __package_json__ = __prefix__ / _PKG_PATH
    __js_src__ = __package_json__.parent.relative_to(__prefix__).as_posix()


__js__ = json.loads(__package_json__.read_text(encoding="utf-8"))
__version__ = __js__["version"].replace("-alpha.", "a").replace("-beta.", "b").replace("-rc.", "rc")
