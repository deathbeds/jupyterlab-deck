"""A lightweight presentation mode for JupyterLab."""

from ._version import __js__, __version__, __js_src__

__all__ = ["__version__", "_jupyter_labextension_paths"]


def _jupyter_labextension_paths():
    return [{"src":  __js_src__, "dest": __js__["name"]}]
