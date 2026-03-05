#!/usr/bin/env node
/**
 * ottobon-hub CLI entry point.
 *
 * Install globally:
 *   cd cli && npm install && npm run build && npm link
 *
 * Then from any project:
 *   ottobon-hub init
 *   ottobon-hub add
 *   ottobon-hub add <component-name>
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';

// ── Banner ───────────────────────────────────────────────────────────────────
function printBanner(): void {
    console.log(
        `\n  ${chalk.bold.white('●')} ${chalk.bold.white('ottobon')}${chalk.cyan('hub')}  ` +
        chalk.dim('Enterprise Component Registry\n')
    );
}

// ── Program ───────────────────────────────────────────────────────────────────
const program = new Command();

program
    .name('ottobon-hub')
    .description('Inject shared React/TypeScript components into your project.')
    .version('1.0.0', '-v, --version', 'Show CLI version')
    .addHelpText(
        'beforeAll',
        `\n  ${chalk.bold.white('●')} ${chalk.bold.white('ottobon')}${chalk.cyan('hub')}  ${chalk.dim('Enterprise Component Registry')}`
    );

// ── Commands ───────────────────────────────────────────────────────────────────

program
    .command('init')
    .description('Initialize the component hub in the current project')
    .action(async () => {
        printBanner();
        await initCommand();
    });

program
    .command('add [component-name]')
    .description('Inject a component into your project (interactive if no name given)')
    .action(async (componentName?: string) => {
        printBanner();
        await addCommand(componentName);
    });

// ── Global error handler ───────────────────────────────────────────────────────
program.configureOutput({
    outputError: (str) => {
        console.error(`\n  ${chalk.red('✖')}  ${str.trim()}\n`);
    },
});

process.on('uncaughtException', (err) => {
    console.error(
        `\n  ${chalk.red('✖')}  ${chalk.bold('Unexpected error.')}\n` +
        `     ${chalk.dim(err.message)}\n\n` +
        `     ${chalk.dim('Please report this at github.com/your-org/component-hub/issues')}\n`
    );
    process.exit(1);
});

program.parse(process.argv);
