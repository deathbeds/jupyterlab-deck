---
name: Release
about: Prepare for a release
labels: maintenance
---

- [ ] merge all outstanding PRs [![ms-badge]](ms)
    <!-- change `1234`` to the milestone id (small number) and `1.2.3.4` to the label -->
  [ms-badge]:
    https://img.shields.io/github/milestones/progress/deathbeds/jupyterlab-deck/1234
    <!-- change  `1.2.3.4` to the label -->
  [ms]:
    https://github.com/deathbeds/jupyterlab-deck/issues?q=is%3Aopen+is%3Aissue+milestone%3A1.2.3.4
  - [ ] _blocking #PR here_
- [ ] ensure `CHANGELOG.md` is up-to-date
- [ ] ensure the versions have been bumped
- [ ] validate on ReadTheDocs
  - [ ] _URL of build_
- [ ] wait for a successful build of `main`
  - [ ] _URL of build_
- [ ] download the `dist` archive and unpack somewhere
- [ ] create a new release through the GitHub UI
  - [ ] paste in the relevant `CHANGELOG.md` entries
  - [ ] upload the artifacts
  - [ ] upload distribution to package repositories
    ```bash
    #!/usr/bin/env bash
    set -eux
    ls jupyterlab_deck.*.tar.gz jupyterlab_deck.*.whl deathbeds-jupyterlab-deck*.tgz
    twine upload jupyterlab_deck.*.tar.gz jupyterlab_deck.*.whl
    npm login
    for tarball in deathbeds-jupyterlab-deck*.tgz; do
      npm publish $tarball
    done
    npm logout
    ```
    - [ ] _URL on npmjs.org here_
    - [ ] _URL on pypi here_
- [ ] postmortem
  - [ ] handle `conda-forge` [feedstock] tasks
    - [ ] _URL on `conda-forge/jupyterlab-deck-feedstock` here_
    - [ ] _URL on `anaconda.org`_
  - [ ] validate on binder via simplest-possible gists (if viable)
  - [ ] create postmortem PR _PR# here_
    - [ ] bump to next development version
    - [ ] bump the `CACHE_EPOCH`
    - [ ] rebuild nodejs locks
      - [ ] `rm yarn.lock`
      - [ ] `doit lint || doit lint`
    - [ ] commit the new locks
    - [ ] update release procedures with lessons learned in
          `.github/ISSUE_TEMPLATE/release.md`

[feedstock]: https://github.com/conda-forge/jupyterlab-deck-feedstock
[release]: https://github.com/deathbeds/jupyterlab-deck/releases
