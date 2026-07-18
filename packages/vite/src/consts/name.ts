const VIRTUAL_ENTRY = "virtual:srvkit" as const;

const VIRTUAL_ENTRY_RESOLVED = `\0${VIRTUAL_ENTRY}` as const;

/**
 * Cloudflare Vite plugin name.
 *
 * @see https://github.com/cloudflare/workers-sdk/blob/@cloudflare/vite-plugin@1.45.0/packages/vite-plugin-cloudflare/src/index.ts#L82
 */
const CLOUDFLARE_PLUGIN_NAME = "vite-plugin-cloudflare";

/**
 * Cloudflare Vite plugin uses this virtual ID as user's entry.
 *
 * Therefore, we redirect this ID to srvkit's virtual entry so it ends up
 * exporting srvkit's one instead of the raw user module.
 *
 * @see https://github.com/cloudflare/workers-sdk/blob/@cloudflare/vite-plugin@1.45.0/packages/vite-plugin-cloudflare/src/plugins/virtual-modules.ts#L10
 */
const CLOUDFLARE_USER_ENTRY = "virtual:cloudflare/user-entry" as const;

export {
    CLOUDFLARE_PLUGIN_NAME,
    CLOUDFLARE_USER_ENTRY,
    VIRTUAL_ENTRY,
    VIRTUAL_ENTRY_RESOLVED,
};
