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
	},
	{
		type: 'text',
		name: 'email',
		message: 'What is the contact email of your company?',
	},
	{
		type: 'text',
		name: 'category',
		message: 'In which category belongs your plugin?',
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
	vendor: /Studio Bridge/gu,
	website: /https:\/\/github\.com\/getstudiobridge\/studiobridge/gu,
	email: /hello@studiobridge\.com/gu,
	category: /Fx/gu,
	version: /STUDIO_BRIDGE_VERSION 1\.0\.0/gu,
	processorUID: /7C41BB75B556527392439BEADC67B477/gu,
	binaryProcessorUID: /0x7C41BB75, 0xB5565273, 0x92439BEA, 0xDC67B477/gu,
	binaryControllerUID: /0x078FC5FA, 0xC5355F1F, 0x8A0C32A7, 0xEAB1BC9E/gu,
	bundleIdentifier: /com\.studiobridge\.\$\{PROJECT\}/gu,
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
	await executeBinarySilent('git', 'clone', '--recursive', 'git@github.com:getstudiobridge/example.git', paramCaseName);
	remove(`${paramCaseName}/.git`);

	const cmakelistsTxt = `${paramCaseName}/CMakeLists.txt`;
	replaceInFile(cmakelistsTxt, placeholders.name, pascalCaseName);
	replaceInFile(cmakelistsTxt, placeholders.version, `STUDIO_BRIDGE_VERSION ${version}`);
	replaceInFile(cmakelistsTxt, placeholders.processorUID, processorUID);
	replaceInFile(cmakelistsTxt, placeholders.bundleIdentifier, bundleIdentifier);

	const packageJson = `${paramCaseName}/package.json`;
	replaceInFile(packageJson, placeholders.name, paramCaseName);

	const infoH = `${paramCaseName}/src/info.h`;
	replaceInFile(infoH, placeholders.name, name);
	replaceInFile(infoH, placeholders.vendor, vendor);
	replaceInFile(infoH, placeholders.website, website);
	replaceInFile(infoH, placeholders.email, email);
	replaceInFile(infoH, placeholders.category, category);
	replaceInFile(infoH, placeholders.binaryProcessorUID, formatBinaryVSTID(processorUID));
	replaceInFile(infoH, placeholders.binaryControllerUID, formatBinaryVSTID(controllerUID));

	const newSnapshotName = placeholders.snapshotName.replace(placeholders.processorUID, processorUID);
	fs.renameSync(`${paramCaseName}/public/${placeholders.snapshotName}`, `${paramCaseName}/public/${newSnapshotName}`);

	const newSnapshot2xName = placeholders.snapshot2xName.replace(placeholders.processorUID, processorUID);
	fs.renameSync(
		`${paramCaseName}/public/${placeholders.snapshot2xName}`,
		`${paramCaseName}/public/${newSnapshot2xName}`,
	);

	logger.info('Installing JavaScript dependencies using Yarn...');
	await executeBinarySilent('yarn', '--cwd', paramCaseName);

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

Additional documentation: https://studiobridge.netlify.app/docs/basics/getting-started`);
}

export default spawnNew;
