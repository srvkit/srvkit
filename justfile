set shell := ["bash", "-cu"]
set windows-shell := ["pwsh", "-Command"]

tsc := "pnpm exec tsc"
biome := "pnpm exec biome"
tsdown := "pnpm exec tsdown"
vitest := "pnpm exec vitest"

publish_dev := "pnpm publish --no-git-checks --tag dev --access public"
publish := "pnpm publish --access public"

pkg := "package"

tst := "test"

common := "packages/common"
vite := "packages/vite"
rsbuild := "packages/rsbuild"

common_test := "tests/common"
vite_test := "tests/vite"
rsbuild_test := "tests/rsbuild"

# Default action
_:
    just --list -u

# Install
i:
    pnpm install

# Format code
fmt:
    {{biome}} check --write .

# Lint code with ls-lint
ls-lint:
    cd ./{{common}}/src && ls-lint -config ../../../.ls-lint.yaml
    cd ./{{vite}}/src && ls-lint -config ../../../.ls-lint.yaml
    cd ./{{rsbuild}}/src && ls-lint -config ../../../.ls-lint.yaml

# Lint code with ls-lint
lslint:
    just ls-lint

# Lint code with typos-cli
typos:
    typos

# Lint code with TypeScript Compiler
tsc:
    cd ./{{common}} && {{tsc}} --noEmit
    cd ./{{vite}} && {{tsc}} --noEmit
    cd ./{{rsbuild}} && {{tsc}} --noEmit

# Lint code
lint:
    just lslint
    just typos
    just tsc

# Lint code with Biome
lint-biome:
    {{biome}} lint .

# Build package
build:
    cd ./{{common}} && {{tsdown}} -c tsdown.config.ts
    cd ./{{vite}} && {{tsdown}} -c tsdown.config.ts
    cd ./{{rsbuild}} && {{tsdown}} -c tsdown.config.ts

# Test package
test:
    cd ./{{common_test}} && {{vitest}} run
    cd ./{{vite_test}} && {{vitest}} run
    cd ./{{rsbuild_test}} && {{vitest}} run

# Check code
check:
    just fmt
    just lint
    just build
    just test

# Publish package with dev tag as dry-run
publish-dev-try:
    cd ./{{common}} && {{publish_dev}} --dry-run
    cd ./{{vite}} && {{publish_dev}} --dry-run
    cd ./{{rsbuild}} && {{publish_dev}} --dry-run

# Publish package with dev tag
publish-dev:
    cd ./{{common}} && {{publish_dev}}
    cd ./{{vite}} && {{publish_dev}}
    cd ./{{rsbuild}} && {{publish_dev}}

# Publish package as dry-run
publish-try:
    cd ./{{common}} && {{publish}} --dry-run
    cd ./{{vite}} && {{publish}} --dry-run
    cd ./{{rsbuild}} && {{publish}} --dry-run

# Publish package
publish:
    cd ./{{common}} && {{publish}}
    cd ./{{vite}} && {{publish}}
    cd ./{{rsbuild}} && {{publish}}

# Clean builds (Linux)
clean-linux:
    rm -rf ./{{rsbuild}}/dist
    rm -rf ./{{vite}}/dist
    rm -rf ./{{common}}/dist

# Clean builds (macOS)
clean-macos:
    just clean-linux

# Clean builds (Windows)
clean-windows:
    Remove-Item -Recurse -Force ./{{rsbuild}}/dist
    Remove-Item -Recurse -Force ./{{vite}}/dist
    Remove-Item -Recurse -Force ./{{common}}/dist

# Clean builds
clean:
    just clean-{{os()}}

# Clean everything (Linux)
clean-all-linux:
    just clean

    rm -rf ./{{rsbuild}}/node_modules
    rm -rf ./{{vite}}/node_modules
    rm -rf ./{{common}}/node_modules

    rm -rf ./node_modules

# Clean everything (macOS)
clean-all-macos:
    just clean-all-linux

# Clean everything (Windows)
clean-all-windows:
    just clean

    Remove-Item -Recurse -Force ./{{rsbuild}}/node_modules
    Remove-Item -Recurse -Force ./{{vite}}/node_modules
    Remove-Item -Recurse -Force ./{{common}}/node_modules

    Remove-Item -Recurse -Force ./node_modules

# Clean everything
clean-all:
    just clean-all-{{os()}}
