/**
 * ottobon-hub init
 *
 * Bootstraps the current directory as a hub-enabled project.
 * Creates hub.config.json with the developer's preferred output dir,
 * API URL, and a generated user ID for telemetry.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { randomUUID } from 'crypto';
import { writeConfig, getConfigPath, readConfig } from '../config.js';

export async function initCommand(): Promise<void> {
    console.log(
        `\n${chalk.bold.white('  ottobon-hub')} ${chalk.dim('/')} ${chalk.cyan('init')}\n`
    );

    // Warn if already initialized
    const existing = await readConfig();
    if (existing) {
        console.log(
            chalk.yellow('  ⚠  hub.config.json already exists in this directory.\n')
        );
        const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
            {
                type: 'confirm',
                name: 'overwrite',
                message: 'Overwrite existing configuration?',
                default: false,
            },
        ]);
        if (!overwrite) {
            console.log(chalk.dim('\n  Aborted. Existing config preserved.\n'));
            return;
        }
    }

    const answers = await inquirer.prompt<{
        outputDir: string;
        apiUrl: string;
    }>([
        {
            type: 'input',
            name: 'outputDir',
            message: 'Where should components be injected?',
            default: './src/components/ui',
        },
        {
            type: 'input',
            name: 'apiUrl',
            message: 'Hub API base URL:',
            default: 'http://localhost:3000',
        },
    ]);

    // Generate a stable anonymous user ID for this machine/developer
    const userId = randomUUID();

    await writeConfig({
        outputDir: answers.outputDir,
        apiUrl: answers.apiUrl,
        userId,
    });

    console.log(
        `\n  ${chalk.green('✓')}  Config written to ${chalk.cyan(getConfigPath())}\n` +
        `     ${chalk.dim('outputDir:')} ${chalk.white(answers.outputDir)}\n` +
        `     ${chalk.dim('apiUrl   :')} ${chalk.white(answers.apiUrl)}\n` +
        `     ${chalk.dim('userId   :')} ${chalk.white(userId)}\n\n` +
        `  ${chalk.dim('Run')} ${chalk.cyan('ottobon-hub add')} ${chalk.dim('to inject your first component.')}\n`
    );
}
