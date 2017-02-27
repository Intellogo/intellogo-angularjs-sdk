This directory contains shared git hooks. In order to tell Git to use them, you must edit your local git configuration by setting the `core.hooksPath` to this directory:
```
git config --add core.hooksPath custom-git-hooks
```