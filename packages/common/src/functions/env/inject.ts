import type { EnvNumber, EnvString } from "envkist";
import type { InjectAccessor } from "envkist/internal/@types/inject";

import type { ResolvableNumber, ResolvableString } from "#/@types/env";
import type { Runtime } from "#/@types/options/complete";

import { env } from "envkist";
import { createInject } from "envkist/internal/functions/inject";
import { accessor as bun } from "envkist/internal/modules/bun/inject";
import { accessor as workerd } from "envkist/internal/modules/cloudflare/inject";
import { accessor as deno } from "envkist/internal/modules/deno/inject";
import { accessor as node } from "envkist/internal/modules/node/inject";

const RUNTIME_ACCESSORS: Record<Runtime, InjectAccessor> = {
    node,
    deno,
    bun,
    workerd,
};

/**
 * Inject resolvable string.
 */
function injectString(runtime: Runtime, value: ResolvableString): string;

/**
 * Inject resolvable string with fallback value.
 */
function injectString(
    runtime: Runtime,
    value: ResolvableString,
    fallback: string,
): string;

function injectString(
    runtime: Runtime,
    value: ResolvableString,
    fallback?: string,
): string {
    if (typeof value === "string") return JSON.stringify(value);

    const inject = createInject(RUNTIME_ACCESSORS[runtime]);

    if (fallback === void 0) return inject(value);

    const withFallback: EnvString<string | undefined> =
        value.fallback !== void 0 ? value : env.string(value.name, fallback);

    return inject(withFallback);
}

/**
 * Inject resolvable number.
 */
function injectNumber(runtime: Runtime, value: ResolvableNumber): string;

/**
 * Inject resolvable number with fallback value.
 */
function injectNumber(
    runtime: Runtime,
    value: ResolvableNumber,
    fallback: number,
): string;

function injectNumber(
    runtime: Runtime,
    value: ResolvableNumber,
    fallback?: number,
): string {
    if (typeof value === "number") return JSON.stringify(value);

    const inject = createInject(RUNTIME_ACCESSORS[runtime]);

    if (fallback === void 0) return inject(value);

    const withFallback: EnvNumber<number | undefined> =
        value.fallback !== void 0 ? value : env.number(value.name, fallback);

    return inject(withFallback);
}

export { injectNumber, injectString };
