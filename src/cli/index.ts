#! /usr/bin/env node

import yargs from 'yargs/yargs';

import spawnInstall from './install';
import spawnNew from './new';

function main() {
	const cli = yargs(process.argv.slice(2));

	cli.command('install', 'Download & install Studio Bridge C++ SDK', () => {}, spawnInstall);

	cli.command(
		'new <name>',
		'Create a Studio Bridge project',
		(yargs) => {
			yargs.positional('name', {
				describe: 'Project name',
				type: 'string',
			});
		},
		spawnNew,
	);

	cli.demandCommand();
	cli.help();
	cli.wrap(72);
	cli.parse();
}

main();
