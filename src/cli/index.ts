#! /usr/bin/env node

import yargs from 'yargs/yargs';

import spawnGenerateParameters from './generate/parameters';
import spawnGenerateSchema from './generate/schema';
import spawnNew from './new';

function main() {
	const cli = yargs(process.argv.slice(2));

	cli.command('new', 'Create a Bounce project', () => {}, spawnNew);
	cli.command('generate', 'Generate C++ code from TypeScript', (cli) => {
		cli.option('o', {
			demandOption: true,
			desc: 'Output directory to generate C++ files in',
			alias: 'output',
		});

		cli.command(
			'schema [paths..]',
			'Generate C++ definitions from TypeScript types',
			(cli) => {
				cli.option('n', {
					desc: 'Namespace to generate C++ classes into',
					alias: 'namespace',
				});
			},
			spawnGenerateSchema,
		);

		cli.command(
			'parameters <path>',
			'Generate parameters C++ definitions from controller config',
			() => {},
			spawnGenerateParameters,
		);

		cli.strict();
		cli.demandCommand();
		cli.help();
	});

	cli.showHelpOnFail(false);
	cli.demandCommand();
	cli.strict();
	cli.help();
	cli.wrap(80);
	cli.parse();
}

main();
