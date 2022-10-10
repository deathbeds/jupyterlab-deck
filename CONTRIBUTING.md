## Contributing

### Setup

- Start with [Mambaforge](https://github.com/conda-forge/miniforge)

```bash
mamba env update --prefix .venv --file .binder/environment.yml
source activate ./.venv
```

### `doit`

The various build tasks are managed by [doit](https://pydoit.org). To get up to a
ready-to-play JupyterLab:

```bash
doit serve:lab
```

See other available tasks with:

```bash
doit list
```

### Releasing

- Start a [release issue](https://github.com/jupyterlab-deck/issues)
- Follow the checklist
