# `jupyterlab-deck`

|        docs         |                      install                      |       extend        |                        demo                         |                    ci                     |
| :-----------------: | :-----------------------------------------------: | :-----------------: | :-------------------------------------------------: | :---------------------------------------: |
| [![rtd-badge]][rtd] | [![pypi-badge]][pypi]<br/>[![conda-badge]][conda] | [![npm-badge]][npm] | [![binder-badge]][binder]<br/>[![lite-badge]][lite] | [![ci-badge]][ci]<br/>[![cov-badge]][cov] |

[binder-badge]: https://mybinder.org/badge_logo.svg
[binder]:
  https://mybinder.org/v2/gh/deathbeds/jupyterlab-deck/HEAD?urlpath=lab/tree/examples/README.ipynb
[ci-badge]: https://img.shields.io/github/workflow/status/deathbeds/jupyterlab-deck/CI
[ci]: https://github.com/deathbeds/jupyterlab-deck/actions?query=branch%3Amain
[rtd-badge]: https://img.shields.io/readthedocs/jupyterlab-deck
[rtd]: https://jupyterlab-deck.rtfd.io
[lite-badge]:
  https://raw.githubusercontent.com/jupyterlite/jupyterlite/main/docs/_static/badge-launch.svg
[lite]:
  https://jupyterlab-deck.rtfd.io/en/stable/_static/lab/index.html?path=README.ipynb
[conda-badge]: https://img.shields.io/conda/vn/conda-forge/jupyterlab-deck
[conda]: https://anaconda.org/conda-forge/jupyterlab-deck
[pypi-badge]: https://img.shields.io/pypi/v/jupyterlab-deck
[pypi]: https://pypi.org/project/jupyterlab-deck/
[npm]: https://npmjs.com/package/@deathbeds/jupyterlab-deck
[npm-badge]: https://img.shields.io/npm/v/@deathbeds/jupyterlab-deck
[cov]: https://codecov.io/gh/deathbeds/jupyterlab-deck
[cov-badge]:
  https://codecov.io/gh/deathbeds/jupyterlab-deck/branch/main/graph/badge.svg?token=LS6ZzwKlqU

> Lightweight presentations for JupyterLab

## Installation

```bash
pip install jupyterlab-deck
```

or

```
mamba install -c conda-forge jupyterlab-deck # or conda, if you must
```

> See [`CONTRIBUTING.md`][contributing] for a development installation.

[contributing]: https://github.com/deathbeds/jupyterlab-deck

## Usage

- Add _slide metadata_ with the _Advanced tools_
- When viewing a _Notebook_, click the _deck_ icon
- Use the _navigation controls_ or _keyboard shortcuts_ to navigate through the deck
- Exit the deck with <kbd>shift+esc</kbd>

## Uninstall

```
pip uninstall jupyterlab-deck
```

or

```
mamba remove jupyterlab-deck # or conda if you must
```

## Configuration

### Enabling Deck Mode at startup

- see the JupyterLab docs about [settings `overrides.json`][overrides].

```json
{
  "@deathbeds/jupyterlab-deck:plugin": {
    "active": true
  }
}
```

[overrides]:
  https://jupyterlab.readthedocs.io/en/stable/user/directories.html#overrides-json
