import type { Rspack } from "@rsbuild/core";

type Replacement = {
    pattern: RegExp;
    replacement: string;
};

type LoaderOptions = {
    replacements: Replacement[];
};

function loader(
    this: Rspack.LoaderContext<LoaderOptions>,
    source: string,
): string {
    const options: LoaderOptions = this.getOptions();

    let result: string = source;

    for (const { pattern, replacement } of options.replacements) {
        result = result.replace(pattern, replacement);
    }

    return result;
}

export default loader;

export type { LoaderOptions };
