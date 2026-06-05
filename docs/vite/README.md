[< Back](../../README.md)

# Vite

This is the documentation for the `@srvkit/vite` package.

## Installation

Install this package as a dependency in the project:

```sh
# npm
npm i @srvkit/vite

# Yarn
yarn add @srvkit/vite

# pnpm
pnpm add @srvkit/vite

# Deno
deno add npm:@srvkit/vite

# Bun
bun add @srvkit/vite
```

## Usage

Add the plugin into the Vite config:

```ts
// ./vite.config.ts

import { defineConfig } from "vite";
import { srvkit } from "@srvkit/vite/plugin";

export default defineConfig({
    plugins: [
        srvkit(),
    ],
});
```

