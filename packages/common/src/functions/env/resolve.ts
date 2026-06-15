import type { EnvNumber, EnvString } from "envkist";

import type { ResolvableNumber, ResolvableString } from "#/@types/env";

import { env, resolve } from "envkist";

/**
 * Resolve optional resolvable string.
 */
function resolveString(value: ResolvableString | undefined): string | undefined;

/**
 * Resolve resolvable string with fallback.
 */
function resolveString(
    value: ResolvableString | undefined,
    fallback: string,
): string;

function resolveString(
    value: ResolvableString | undefined,
    fallback?: string,
): string | undefined {
    if (value === void 0) return void 0;

    if (typeof value === "string") return value;

    if (fallback === void 0) return resolve(value);

    const withFallback: EnvString<string | undefined> =
        value.fallback !== void 0 ? value : env.string(value.name, fallback);

    return resolve(withFallback);
}

/**
 * Resolve optional resolvable number.
 */
function resolveNumber(value: ResolvableNumber | undefined): number | undefined;

/**
 * Resolve resolvable number with fallback.
 */
function resolveNumber(
    value: ResolvableNumber | undefined,
    fallback: number,
): number;

function resolveNumber(
    value: ResolvableNumber | undefined,
    fallback?: number,
): number | undefined {
    if (value === void 0) return void 0;

    if (typeof value === "number") return value;

    if (fallback === void 0) return resolve(value);

    const withFallback: EnvNumber<number | undefined> =
        value.fallback !== void 0 ? value : env.number(value.name, fallback);

    return resolve(withFallback);
}

export { resolveNumber, resolveString };
