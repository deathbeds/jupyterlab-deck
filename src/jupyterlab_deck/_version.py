import json
from pathlib import Path

HERE = Path(__file__).parent
__package_json__ = (
    HERE / "_d/share/jupyter/labextensions/@deathbeds/jupyterlab-deck/package.json"
)
__js__ = json.loads(__package_json__.read_text(encoding="utf-8"))
__version__ = __js__["version"].replace("-alpha", "a").replace("-beta", "b")
