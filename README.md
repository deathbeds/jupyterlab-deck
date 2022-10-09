# `jupyterlab-deck`

[![rtd-badge]][rtd] [![binder-badge]][binder] [![ci-badge]][ci]

[binder-badge]: https://mybinder.org/badge_logo.svg
[binder]:
  https://mybinder.org/v2/gh/deathbeds/jupyterlab-deck/HEAD?urlpath=lab/tree/examples/README.ipynb
[ci-badge]: https://img.shields.io/github/checks-status/deathbeds/jupyterlab-deck/main
[ci]: https://github.com/deathbeds/jupyterlab-deck/actions?query=branch%3Amain
[rtd-badge]: https://img.shields.io/readthedocs/jupyterlab-deck
[rtd]: https://jupyterlab-deck.rtfd.io

> Lightweight presentations for JupyterLab

## Installation

```bash
pip install jupyterlab-deck
```

or

```
mamba install jupyterlab-deck # or conda, if you must
```

> See [`CONTRIBUTING.md`](https://github.com/deathbeds/jupyterlab-deck) for a
> development installation.

## Usage

- Add _slide metadata_ with the _Advanced tools_
- When viewing a _Notebook_, click the _deck_ icon
- Use the _navigation controls_ or _keyboard shortcuts_ to navigate through the deck
- Exit the deck with <kbd>shift+esc</kbd>

## Enabling Deck Mode at startup

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

## Uninstall

```
pip uninstall jupyterlab-deck
```

or

```
mamba remove jupyterlab-deck # or conda if you must
```
