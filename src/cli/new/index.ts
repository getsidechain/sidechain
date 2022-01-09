import fs from 'fs';
import prompt, { PromptObject } from 'prompts';
import { paramCase, pascalCase } from 'change-case';

import logger from '../logger';
import { executeBinarySilent } from '../utility/exec';
import { formatBinaryVSTID, generateUniqueVSTID } from './utility';
import { remove, replaceInFile } from '../utility/files';
import { version } from '../../../package.json';

const prompts: PromptObject[] = [
	{
		type: 'text',
		name: 'name',
		message: 'What is the commercial name of your plugin?',
		initial: 'Project Pro Gain-X',
	},
	{
		type: 'text',
		name: 'vendor',
		message: 'What is the name of your company?',
		initial: 'My Company Inc.',
	},
	{
		type: 'text',
		name: 'website',
		message: 'What is the website of your company?',
		initial: 'https://example.com',
	},
	{
		type: 'text',
		name: 'email',
		message: 'What is the contact email of your company?',
		initial: 'hello@example.com',
	},
	{
		type: 'text',
		name: 'category',
		message: 'In which category belongs your plugin?',
		initial: 'Fx',
	},
	{
		type: 'text',
		name: 'bundleIdentifier',
		message: 'What is the Apple bundle identifier of the plugin?',
		initial: (_, { name }) => `com.mycompany.${paramCase(name)}`,
	},
];

const placeholders = {
	name: /[S|s]tudio[B|b]ridge[E|e]xample/gu,
	vendor: /Bounce/gu,
	website: /https:\/\/github\.com\/getbounce\/bounce/gu,
	email: /hello@bounce\.com/gu,
	category: /Fx/gu,
	version: /BOUNCE_VERSION 1\.0\.0/gu,
	processorUID: /7C41BB75B556527392439BEADC67B477/gu,
	binaryProcessorUID: /0x7C41BB75, 0xB5565273, 0x92439BEA, 0xDC67B477/gu,
	binaryControllerUID: /0x078FC5FA, 0xC5355F1F, 0x8A0C32A7, 0xEAB1BC9E/gu,
	bundleIdentifier: /com\.bounce\.template\.\$\{PROJECT\}/gu,
	snapshotName: '7C41BB75B556527392439BEADC67B477_snapshot.png',
	snapshot2xName: '7C41BB75B556527392439BEADC67B477_snapshot_2.0x.png',
};

async function spawnNew(): Promise<void> {
	const { name, vendor, website, email, category, bundleIdentifier } = await prompt(prompts, {
		onCancel: () => process.exit(1),
	});

	const processorUID = generateUniqueVSTID();
	const controllerUID = generateUniqueVSTID();

	const paramCaseName = paramCase(name);
	const pascalCaseName = pascalCase(name, { transform: (value) => value });

	console.info();
	logger.info('Creating project files...');
	await executeBinarySilent('git', 'clone', 'git@github.com:getbounce/example.git', paramCaseName);
	process.chdir(paramCaseName);

	remove('.git');
	await executeBinarySilent('git', 'init');

	remove('vendor/json');
	await executeBinarySilent(
		'git',
		'submodule',
		'add',
		'https://github.com/nlohmann/json',
		'vendor/json',
	);

	remove('vendor/vst3sdk');
	await executeBinarySilent(
		'git',
		'submodule',
		'add',
		'https://github.com/steinbergmedia/vst3sdk',
		'vendor/vst3sdk',
	);
	process.chdir('vendor/vst3sdk');
	await executeBinarySilent('git', 'submodule', 'update', '--init', '--recursive');
	process.chdir('../..');

	replaceInFile('CMakeLists.txt', placeholders.name, pascalCaseName);
	replaceInFile('CMakeLists.txt', placeholders.version, `BOUNCE_VERSION ${version}`);
	replaceInFile('CMakeLists.txt', placeholders.processorUID, processorUID);
	replaceInFile('CMakeLists.txt', placeholders.bundleIdentifier, bundleIdentifier);

	replaceInFile('package.json', placeholders.name, paramCaseName);
	replaceInFile('public/index.html', placeholders.name, name);

	replaceInFile('src/info.hpp', placeholders.name, name);
	replaceInFile('src/info.hpp', placeholders.vendor, vendor);
	replaceInFile('src/info.hpp', placeholders.website, website);
	replaceInFile('src/info.hpp', placeholders.email, email);
	replaceInFile('src/info.hpp', placeholders.category, category);
	replaceInFile('src/info.hpp', placeholders.binaryProcessorUID, formatBinaryVSTID(processorUID));
	replaceInFile('src/info.hpp', placeholders.binaryControllerUID, formatBinaryVSTID(controllerUID));

	const newSnapshotName = placeholders.snapshotName.replace(
		placeholders.processorUID,
		processorUID,
	);
	fs.renameSync(`public/${placeholders.snapshotName}`, `public/${newSnapshotName}`);

	const newSnapshot2xName = placeholders.snapshot2xName.replace(
		placeholders.processorUID,
		processorUID,
	);
	fs.renameSync(`public/${placeholders.snapshot2xName}`, `public/${newSnapshot2xName}`);

	logger.info('Installing JavaScript dependencies using Yarn...');
	await executeBinarySilent('yarn');

	logger.info(`Done.

Next steps:

  cd ${paramCaseName}

Build CMake project:

  mkdir build
  cd build
  cmake ..
  cmake --build . -j 8

Target plugin will be automatically installed
and can be tested right away.

Start UI development server:

  yarn start

Additional documentation: https://bounce.com/docs/basics/getting-started`);
}

export default spawnNew;
