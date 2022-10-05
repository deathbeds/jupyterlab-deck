"""A lightweight presentation mode for JupyterLab."""

from ._version import __js__, __package_json__, __version__

__all__ = ["__version__", "_jupyter_labextension_paths"]


def _jupyter_labextension_paths():
    from pathlib import Path

    return [
        dict(
            src=f"{__package_json__.parent.relative_to(Path(__file__).parent).as_posix()}",
            dest=__js__["name"],
        )
    ]
