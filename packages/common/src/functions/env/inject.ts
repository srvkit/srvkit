import type { EnvNumber, EnvString } from "envkist";

import type { ResolvableNumber, ResolvableString } from "#/@types/env";

import { env, inject } from "envkist";

/**
 * Inject resolvable string.
 */
function injectString(value: ResolvableString): string;

/**
 * Inject resolvable string with fallback value.
 */
function injectString(value: ResolvableString, fallback: string): string;

function injectString(value: ResolvableString, fallback?: string): string {
    if (typeof value === "string") return JSON.stringify(value);

    if (fallback === void 0) return inject(value);

    const withFallback: EnvString<string | undefined> =
        value.fallback !== void 0 ? value : env.string(value.name, fallback);

    return inject(withFallback);
}

/**
 * Inject resolvable number.
 */
function injectNumber(value: ResolvableNumber): string;

/**
 * Inject resolvable number with fallback value.
 */
function injectNumber(value: ResolvableNumber, fallback: number): string;

function injectNumber(value: ResolvableNumber, fallback?: number): string {
    if (typeof value === "number") return JSON.stringify(value);

    if (fallback === void 0) return inject(value);

    const withFallback: EnvNumber<number | undefined> =
        value.fallback !== void 0 ? value : env.number(value.name, fallback);

    return inject(withFallback);
}

export { injectNumber, injectString };
