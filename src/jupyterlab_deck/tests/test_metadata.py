"""jupyterlab-deck metadata tests."""
import jupyterlab_deck


def test_version() -> None:
    """Verify a version is present."""
    assert jupyterlab_deck.__version__, "no version"


def test_js() -> None:
    """Verify the js metadata present."""
    assert jupyterlab_deck.__js__, "no js metadata"


def test_magic_lab_extensions() -> None:
    """Verify the expected number of extensions are exposed."""
    assert (
        len(jupyterlab_deck._jupyter_labextension_paths()) == 1
    ), "too many/few labextensions"
