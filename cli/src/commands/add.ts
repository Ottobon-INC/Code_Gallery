/**
 * ottobon-hub add [component-name]
 *
 * The primary CLI engine. Fetches a component from the hub API and injects
 * the .tsx file into the developer's configured output directory.
 *
 * Flow:
 *  1. Verify hub.config.json exists — styled error if not
 *  2. If no component name given → launch inquirer searchable list
 *  3. Animate ora spinner during API request
 *  4. Write .tsx file to outputDir
 *  5. Display styled success box with ROI telemetry
 */

import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import { readConfig } from '../config.js';
import { fetchComponent, listComponents } from '../api.js';

// Default estimated hours saved per injection (used if not configured)
const DEFAULT_HOURS_SAVED = 2;

export async function addCommand(componentName?: string): Promise<void> {
    console.log(
        `\n${chalk.bold.white('  ottobon-hub')} ${chalk.dim('/')} ${chalk.cyan('add')}\n`
    );

    // ── 1. Load config ────────────────────────────────────────────────────────
    const config = await readConfig();
    if (!config) {
        console.error(
            `\n  ${chalk.red('✖')}  ${chalk.bold('No hub.config.json found.')}\n\n` +
            `     Run ${chalk.cyan('ottobon-hub init')} in your project root first.\n`
        );
        process.exit(1);
    }

    const { apiUrl, userId, outputDir } = config;
    let targetId: string;
    let targetName: string;

    // ── 2. Interactive picker if no name given ─────────────────────────────────
    if (!componentName) {
        const listSpinner = ora({
            text: chalk.dim('Loading component list…'),
            color: 'cyan',
        }).start();

        const components = await listComponents(apiUrl);
        listSpinner.stop();

        if (components.length === 0) {
            console.log(chalk.yellow('\n  ⚠  No components found in the hub yet.\n'));
            return;
        }

        const { selected } = await inquirer.prompt<{ selected: string }>([
            {
                type: 'list',
                name: 'selected',
                message: 'Select a component to add:',
                choices: components.map((c) => ({
                    name: `${chalk.white(c.title.padEnd(30))} ${chalk.dim(c.description.slice(0, 50))}`,
                    value: c.id,
                    short: c.title,
                })),
                pageSize: 12,
            },
        ]);

        targetId = selected;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        targetName = components.find((c) => c.id === selected)!.title;
    } else {
        // Name given — it could be a UUID or a slug. We treat it as an ID for now.
        // Future: add a search-by-name endpoint.
        targetId = componentName;
        targetName = componentName;
    }

    // ── 3. Fetch component from API ─────────────────────────────────────────────
    const spinner = ora({
        text: `${chalk.dim('Fetching')} ${chalk.cyan(targetName)}${chalk.dim('…')}`,
        color: 'cyan',
    }).start();

    const component = await fetchComponent(
        apiUrl,
        targetId,
        userId,
        DEFAULT_HOURS_SAVED
    );

    spinner.stop();

    // ── 4. Write .tsx file ──────────────────────────────────────────────────────
    const resolvedDir = path.resolve(process.cwd(), outputDir);
    const fileName = `${component.title.replace(/\s+/g, '')}.tsx`;
    const filePath = path.join(resolvedDir, fileName);

    await fs.ensureDir(resolvedDir);

    // Guard: warn if file already exists
    if (await fs.pathExists(filePath)) {
        const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
            {
                type: 'confirm',
                name: 'overwrite',
                message: `  ${chalk.yellow(fileName)} already exists. Overwrite?`,
                default: false,
            },
        ]);
        if (!overwrite) {
            console.log(chalk.dim('\n  Aborted. Existing file preserved.\n'));
            return;
        }
    }

    await fs.writeFile(filePath, component.rawCode, 'utf-8');

    // ── 5. Styled success output ────────────────────────────────────────────────
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

    console.log(
        `\n  ${chalk.green('✓')}  ${chalk.bold.white(component.title)} ${chalk.dim('injected successfully')}\n` +
        `\n` +
        `     ${chalk.dim('→')}  ${chalk.cyan(relativePath)}\n` +
        `     ${chalk.dim('⏱')}  Estimated time saved: ${chalk.bold.white(`${DEFAULT_HOURS_SAVED} hrs`)}\n` +
        `     ${chalk.dim('📦')} Used by the team ${chalk.bold.white(component.usageCount.toString())} time${component.usageCount === 1 ? '' : 's'}\n`
    );
}
