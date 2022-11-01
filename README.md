# `jupyterlab-deck`

|        docs         |                      install                      |       extend        |                        demo                         |                                    ci                                     |
| :-----------------: | :-----------------------------------------------: | :-----------------: | :-------------------------------------------------: | :-----------------------------------------------------------------------: |
| [![rtd-badge]][rtd] | [![pypi-badge]][pypi]<br/>[![conda-badge]][conda] | [![npm-badge]][npm] | [![binder-badge]][binder]<br/>[![lite-badge]][lite] | [![ci-badge]][ci]<br/>[![reports-badge]][reports]<br/>[![cov-badge]][cov] |

[binder-badge]: https://mybinder.org/badge_logo.svg
[binder]:
  https://mybinder.org/v2/gh/deathbeds/jupyterlab-deck/HEAD?urlpath=lab/tree/examples/README.ipynb
[ci-badge]: https://img.shields.io/github/workflow/status/deathbeds/jupyterlab-deck/CI
[ci]: https://github.com/deathbeds/jupyterlab-deck/actions?query=branch%3Amain
[reports-badge]:
  https://img.shields.io/github/workflow/status/deathbeds/jupyterlab-deck/pages?label=reports
[reports]: https://deathbeds.github.io/jupyterlab-deck/lab/index.html?path=README.ipynb
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

## Installing

```bash
pip install jupyterlab-deck
```

or

```
mamba install -c conda-forge jupyterlab-deck # or conda, if you must
```

> See [`CONTRIBUTING.md`][contributing] for a development installation.

[contributing]: https://github.com/deathbeds/jupyterlab-deck

### Uninstalling

```bash
pip uninstall jupyterlab-deck
```

or

```bash
mamba remove jupyterlab-deck # or conda if you must
```

## Usage

### Get started

After [installing](#installing), open or create a _Notebook_.

> Other documents _work_ but are not as much fun.

### Deck Mode

> Start _Deck Mode_ by
>
> - in the _Notebook Toolbar_, click ![deck-icon]
> - open the [_Command Palette_][command-palette] and run _Start Deck_

[command-palette]: https://jupyterlab.readthedocs.io/en/stable/user/commands.html

In _Deck Mode_, until you configure any [slide types](#slides), all of your content
should appear in a vertically-scrollable stack.

#### Remote

> In _Deck Mode_, navigate with:
>
> - the onscreen _remote_
>   - if available, up, down, left, right will be available
> - these correspond to the standard keyboard shortcuts,
>   - <kbd>→</kbd>, <kbd>↓</kbd>, <kbd>←</kbd>, <kbd>↑</kbd>
>   - <kbd>shift+enter</kbd> executes and advances
> - the spacebar tries two directions:
>   - <kbd>space</kbd> = <kbd>↓</kbd>, _or_ <kbd>→</kbd>
>   - <kbd>shift+space</kbd> = <kbd>↑</kbd>, _or_ <kbd>←</kbd>

#### Revealing JupyterLab UX Features

Many of the core JupyterLab UI elements are still available, but hidden by default.
Hover over their usual places to reveal them. These include:

- the right and left sidebar
- the _Notebook Toolbar_

#### Hidden JupyterLab UX Features

Some elements are _not_ visible, and cannot be revealed:

- the _Main Menu_
- the _Status Bar_
- the _Cell Toolbar_

> Next Steps:
>
> - use [slideshow types](#slides) to customize how much of your content appears
>   on-screen.
> - use [layer types](#layers) to customize foreground/background behavior
> - use the [design tools](#design-tools) to customize the appearance of cells
> - use the [slide layout tools](#slide-layout) to customize the position and size of
>   cells

#### Exiting Deck Mode

> To exit _Deck Mode_:
>
> - from the remote, click the ![deck-icon]
> - open the [_Command Palette_][command-palette] and run _Stop Deck_

### Slides

Build a slideshow by changing the _slideshow type_ per cell using the [_Property
Inspector_ sidebar][property-inspector] or the [design tools][design-tools].

[design-tools]: #design-tools
[property-inspector]:
  https://jupyterlab.readthedocs.io/en/stable/user/interface.html#left-and-right-sidebar

| type       | purpose                                              |
| ---------- | ---------------------------------------------------- |
| `-`        | (default) stack underneath the previous cell         |
| `slide`    | start a new stack                                    |
| `fragment` | reveal when activated                                |
| `subslide` | start a new cell stack in the optional Y axis        |
| `skip`     | hide the cell entirely                               |
| `notes`    | _TBD: moves this cell to the off-screen note viewer_ |

[deck-icon]:
  https://raw.githubusercontent.com/deathbeds/jupyterlab-deck/main/js/jupyterlab-deck/style/img/deck.svg

### Layers

> Pick a layer type from:
>
> - the [property inspector][property-inspector]
> - or the [design tools].

_Layers_ either temporarily or permanently show content, and won't be reached by.
Specifying a layer scope will override the _slideshow type_. Layers have one of the
following _scopes_:

| scope      | relationship to [slides](#slides)                       |
| ---------- | ------------------------------------------------------- |
| `deck`     | show on _all_ current and future `slide` or `subslides` |
| `stack`    | show until the next `slide`                             |
| `slide`    | show until the next `slide` _or_ `subslide`             |
| `fragment` | only show until the next `fragment`                     |

### Design Tools

> In [Deck mode](#deck-mode), click the _ellipsis_ icon in the bottom right corner

The design tools offer lightweight buttons to:

- show/hide the [slide layout](#slide-layout) overlay
- set the [slideshow type](#slides)
- set the [layer type](#layers)
- change a few key appearance properties:
  - use the sliders to customize
    - `z-index` controls the vertical stacking of elements:
      - higher is "closer" to the user
    - `opacity` controls how vibrant the fonts and colors appear
      - higher is more full
    - `zoom` controls how big the contents of the cell appear
      - higher is bigger
  - un-check the checkbox to restore to the defaults

### Slide Layout

> After opening the [design tools](#design-tools), click the _Show Layout_ button

In _slide layout_ mode, each part of the slide receives an overlay.

Moving a part manually will remove it from the default layout, and allow you to place it
anywhere on the screen, but it will keep the same navigation index.

The keyboard shortcuts and remote should still function as normal.

#### Moving Parts

Click and drag a part overlay to move the part underneath.

#### Resizing Parts

Click one of the _handles_ in the corners of the part overlay to resize a part.

#### Reverting Part Move/Resize

After moving a part to a fixed position, click the **↺** button on a part overlay to
restore the part to the default layout.

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

## Frequently Asked Questions

### Does it work with `notebook 6` aka classic?

**No.** Use [RISE](https://github.com/damianavila/RISE/).

### Does it work with `notebook 7`?

**Not yet.** Navigating multiple documents during the same presentation will probably
never work, as this is incompatible with the one-document-at-a-time design constraint of
the Notebook UX.

### Will it generate PowerPoint?

**No.** This would be a fine third-party extension which could consume notebook metadata
created by this extension, [jupyterlab-fonts], and `nbconvert`-compatible
[slides](#slides).

### Will it generate single-document static HTML presentations?

**No.** Use [`nbconvert`][nbconvert], but no [layers](#layers) or style customization
will work.

[nbconvert]:
  https://nbconvert.readthedocs.io/en/latest/usage.html#reveal-js-html-slideshow

For a full static viewing experience, try something like [JupyterLite].

[jupyterlite]: https://github.com/jupyterlite/jupyterlite

### Will it generate PDF?

**Not yet.**

[jupyterlab-fonts]: https://github.com/jupyterlab-fonts
