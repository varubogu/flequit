# Command Usage History During Project Creation

※This document serves as an initial procedure log and is not required to be performed by each developer.

## Initialization

```bash
bun create tauri-app

✔ Project name · ./
✔ Package name · flequit
✔ Identifier · com.flequit.app
✔ Current directory is not empty, do you want to overwrite? · yes
✔ Choose which language to use for your frontend · TypeScript / JavaScript - (pnpm, yarn, npm, deno, bun)
✔ Choose your package manager · bun
✔ Choose your UI template · Svelte - (https://svelte.dev/)
✔ Choose your UI flavor · TypeScript
```

## Install Required Packages for Tauri

```bash
sudo apt update
sudo apt install
#libwebkit2gtk-4.1-dev \ # Cannot be installed in a clean state
build-essential \
 curl \
 wget \
 file \
 libxdo-dev \
 libssl-dev \
 libayatana-appindicator3-dev \
 librsvg2-dev
```

## Add Translation Functionality

https://inlang.com/m/gerre34r/library-inlang-paraglideJs/vite

```shell
npx @inlang/paraglide-js@latest init
```
