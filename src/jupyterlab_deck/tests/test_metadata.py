"""jupyterlab-deck metadata tests"""
import jupyterlab_deck


def test_version():
    assert jupyterlab_deck.__version__, "no version"


def test_js():
    assert jupyterlab_deck.__js__, "no js metadata"


def test_magic_lab_extensions():
    assert (
        len(jupyterlab_deck._jupyter_labextension_paths()) == 1
    ), "too many/few labextensions"
