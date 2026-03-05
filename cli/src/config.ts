/**
 * Hub config reader/writer.
 *
 * `hub.config.json` is created by `ottobon-hub init` in the root of the
 * developer's project. All other commands read it from the CWD.
 */

import fs from 'fs-extra';
import path from 'path';
import { HubConfig } from './types.js';

const CONFIG_FILE = 'hub.config.json';

/** Resolved path to hub.config.json in the current working directory. */
export function getConfigPath(): string {
    return path.join(process.cwd(), CONFIG_FILE);
}

/**
 * Read and parse hub.config.json from CWD.
 * Returns null if not found (i.e., `init` has not been run).
 */
export async function readConfig(): Promise<HubConfig | null> {
    const configPath = getConfigPath();
    const exists = await fs.pathExists(configPath);
    if (!exists) return null;
    return fs.readJson(configPath) as Promise<HubConfig>;
}

/**
 * Write (or overwrite) hub.config.json in CWD.
 */
export async function writeConfig(config: HubConfig): Promise<void> {
    await fs.writeJson(getConfigPath(), config, { spaces: 2 });
}
