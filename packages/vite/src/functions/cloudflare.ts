import type { Plugin, PluginOption, UserConfig } from "vite";

import { CLOUDFLARE_PLUGIN_NAME } from "#/consts/name";

const isPlugin = (value: unknown): value is Plugin => {
    return typeof value === "object" && value !== null && "name" in value;
};

const flattenPlugins = (plugins: PluginOption): Plugin[] => {
    if (plugins === false || plugins === null || plugins === void 0) {
        return [];
    }

    if (isPlugin(plugins)) {
        return [
            plugins,
        ];
    }

    if (!Array.isArray(plugins)) return [];

    const out: Plugin[] = [];

    for (const item of plugins) {
        out.push(...flattenPlugins(item));
    }

    return out;
};

const hasCloudflarePlugin = (config: UserConfig): boolean => {
    const list: Plugin[] = flattenPlugins(config.plugins);

    return list.some(
        (plugin: Plugin): boolean =>
            typeof plugin.name === "string" &&
            plugin.name.startsWith(CLOUDFLARE_PLUGIN_NAME),
    );
};

export { hasCloudflarePlugin };
