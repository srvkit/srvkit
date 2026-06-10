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

test_common := "tests/common"
test_vite := "tests/vite"
test_rsbuild := "tests/rsbuild"

bench := "bench"

ex_vite := "examples/vite"
ex_rsbuild := "examples/rsbuild"

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
    cd ./{{test_common}} && {{vitest}} run
    cd ./{{test_vite}} && {{vitest}} run
    cd ./{{test_rsbuild}} && {{vitest}} run

# Check code
check:
    just build
    just fmt
    just lint
    just test

# Run benchmark
bench:
    cd ./{{bench}} && {{vitest}} bench --run

# Run Vite example
ex-vite:
    cd ./{{ex_vite}} && pnpm run build

# Run Rsbuild example
ex-rsbuild:
    cd ./{{ex_rsbuild}} && pnpm run build

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
    rm -rf ./{{ex_rsbuild}}/dist
    rm -rf ./{{ex_vite}}/dist

    rm -rf ./{{bench}}/dist

    rm -rf ./{{test_rsbuild}}/__temp__
    rm -rf ./{{test_vite}}/__temp__

    rm -rf ./{{rsbuild}}/dist
    rm -rf ./{{vite}}/dist
    rm -rf ./{{common}}/dist

# Clean builds (macOS)
clean-macos:
    just clean-linux

# Clean builds (Windows)
clean-windows:
    if (Test-Path "./{{ex_rsbuild}}/dist") { Remove-Item -Recurse -Force "./{{ex_rsbuild}}/dist" }
    if (Test-Path "./{{ex_vite}}/dist") { Remove-Item -Recurse -Force "./{{ex_vite}}/dist" }

    if (Test-Path "./{{bench}}/dist") { Remove-Item -Recurse -Force "./{{bench}}/dist" }

    if (Test-Path "./{{test_rsbuild}}/__temp__") { Remove-Item -Recurse -Force "./{{test_rsbuild}}/__temp__" }
    if (Test-Path "./{{test_vite}}/__temp__") { Remove-Item -Recurse -Force "./{{test_vite}}/__temp__" }

    if (Test-Path "./{{rsbuild}}/dist") { Remove-Item -Recurse -Force "./{{rsbuild}}/dist" }
    if (Test-Path "./{{vite}}/dist") { Remove-Item -Recurse -Force "./{{vite}}/dist" }
    if (Test-Path "./{{common}}/dist") { Remove-Item -Recurse -Force "./{{common}}/dist" }

# Clean builds
clean:
    just clean-{{os()}}

# Clean everything (Linux)
clean-all-linux:
    just clean

    rm -rf ./{{ex_rsbuild}}/node_modules
    rm -rf ./{{ex_vite}}/node_modules

    rm -rf ./{{bench}}/node_modules

    rm -rf ./{{test_rsbuild}}/node_modules
    rm -rf ./{{test_vite}}/node_modules
    rm -rf ./{{test_common}}/node_modules

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

    if (Test-Path "./{{ex_rsbuild}}/node_modules") { Remove-Item -Recurse -Force "./{{ex_rsbuild}}/node_modules" }
    if (Test-Path "./{{ex_vite}}/node_modules") { Remove-Item -Recurse -Force "./{{ex_vite}}/node_modules" }

    if (Test-Path "./{{bench}}/node_modules") { Remove-Item -Recurse -Force "./{{bench}}/node_modules" }

    if (Test-Path "./{{test_rsbuild}}/node_modules") { Remove-Item -Recurse -Force "./{{test_rsbuild}}/node_modules" }
    if (Test-Path "./{{test_vite}}/node_modules") { Remove-Item -Recurse -Force "./{{test_vite}}/node_modules" }
    if (Test-Path "./{{test_common}}/node_modules") { Remove-Item -Recurse -Force "./{{test_common}}/node_modules" }

    if (Test-Path "./{{rsbuild}}/node_modules") { Remove-Item -Recurse -Force "./{{rsbuild}}/node_modules" }
    if (Test-Path "./{{vite}}/node_modules") { Remove-Item -Recurse -Force "./{{vite}}/node_modules" }
    if (Test-Path "./{{common}}/node_modules") { Remove-Item -Recurse -Force "./{{common}}/node_modules" }

    if (Test-Path "./node_modules") { Remove-Item -Recurse -Force "./node_modules" }

# Clean everything
clean-all:
    just clean-all-{{os()}}
