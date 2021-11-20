#! /usr/bin/env node

import yargs from 'yargs/yargs';

import spawnNew from './new';

function main() {
	const cli = yargs(process.argv.slice(2));

	cli.command('new', 'Create a Studio Bridge project', () => {}, spawnNew).showHelpOnFail(false);

	cli.strict();
	cli.showHelpOnFail(true);
	cli.demandCommand();
	cli.help();
	cli.wrap(72);
	cli.parse();
}

main();
