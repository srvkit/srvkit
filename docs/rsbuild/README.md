[< Back](../../README.md)

# Rsbuild

This is the documentation for the `@srvkit/rsbuild` package.

## Installation

Install this package as a dependency in the project:

```sh
# npm
npm i @srvkit/rsbuild

# Yarn
yarn add @srvkit/rsbuild

# pnpm
pnpm add @srvkit/rsbuild

# Deno
deno add npm:@srvkit/rsbuild

# Bun
bun add @srvkit/rsbuild
```

## Usage

Add the plugin into the Rsbuild config:

```ts
// ./rsbuild.config.ts

import { defineConfig } from "@rsbuild/core";
import { pluginSrvkit } from "@srvkit/rsbuild/plugin";

export default defineConfig({
    plugins: [
        pluginSrvkit(),
    ],
});
```
