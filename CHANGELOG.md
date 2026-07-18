## Next

### Common

- add `BuildPublicOptions` types
- add `ResolvedBuildPublicOptions` types
- add `CompleteBuildPublicOptions` types
- add internal `dev-runtime` entry point for live server with HMR

### Rsbuild

- add `public.copy` for both `server` and `handler` build targets
- add `public.from` to customize the source directory
- add `public.to` to customize the destination directory inside output directory
- remove `copyPublicDir` option (use `public.copy` instead)
- remove `publicDir` option (use `public.from` instead)

### Vite

- improve the support for Cloudflare integration
- add `public.copy` for both `server` and `handler` build targets
- add `public.from` to customize the source directory
- add `public.to` to customize the destination directory inside output directory
- add internal `dev-runtime` entry point for live server with HMR
- remove `copyPublicDir` option (use `public.copy` instead)
- remove `publicDir` option (use `public.from` instead)

## 0.2.1 (2026-07-08)

### Common

- export `defineEnv` for `NODE_ENV` replacement

### Rsbuild

- replace `NODE_ENV` based on the environment

### Vite

- replace `NODE_ENV` based on the environment

## 0.2.0 (2026-06-16)

### Common

- add `envkist` dependency for environment variable resolution
- add `ResolvableString` and `ResolvableNumber` types for env-aware options
- add `resolveString` / `resolveNumber` for dev-time env value resolution
- add `injectString` / `injectNumber` for runtime-aware env code injection
- export `env`, `is`, and env type from plugin entry

### Rsbuild

- support `env.string()` / `env.number()` for host, port, and TLS options
- add `ExternalsPlugin` for `workerd` runtime target
- export `env`, `is`, and env types from plugin entry

### Vite

- support `env.string()` / `env.number()` for host, port, and TLS options
- export `env`, `is`, and env types from plugin entry

## 0.1.1 (2026-06-11)

### Vite

- disable code splitting for standalone bundles
- make build plugin config take precedence over user config

## 0.1.0 (2026-06-10)

initial release
