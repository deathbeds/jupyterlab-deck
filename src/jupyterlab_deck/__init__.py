"""A lightweight presentation mode for JupyterLab."""

from ._version import __js__, __package_json__, __version__

__all__ = ["__version__", "_jupyter_labextension_paths"]


def _jupyter_labextension_paths():
    return [dict(src=(str(__package_json__.parent)), dest=__js__["name"])]
