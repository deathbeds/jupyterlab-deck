## Contributing

### Setup

- Start with [Mambaforge](https://conda-forge.io/miniforge)

```bash
mamba env update --prefix .venv --file .binder/environment.yml
source activate ./.venv
```

### `doit`

The various build tasks are managed by [`doit`](https://pydoit.org). To get up to a
ready-to-play JupyterLab:

```bash
doit serve:lab
```

See other available tasks with:

```bash
doit list
```

### Legacy

Support for JupyterLab 3 is verified with the `legacy` subtasks.

Run all legacy tasks:

```bash
doit legacy
```

Run an isolated JupyterLab 3 application:

```bash
doit serve:lab:legacy
```

### Releasing

- Start a [release issue](https://github.com/jupyterlab-deck/issues)
- Follow the checklist
