# プロジェクト作成過程のコマンド使用履歴

## 初期化

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

## Tauriに必要なパッケージをインストール

sudo apt update
sudo apt install
#libwebkit2gtk-4.1-dev \ # まっさらな状態ではインストール不可
build-essential \
 curl \
 wget \
 file \
 libxdo-dev \
 libssl-dev \
 libayatana-appindicator3-dev \
 librsvg2-dev

## 翻訳機能を追加

https://inlang.com/m/gerre34r/library-inlang-paraglideJs/vite

```shell
npx @inlang/paraglide-js@latest init
```
