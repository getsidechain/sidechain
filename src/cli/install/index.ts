import { downloadFileToDisk } from '../utility/files';

async function spawnInstall(): Promise<void> {
	await downloadFileToDisk(
		'test.txt',
		'https://github.com/getstudiobridge/test/releases/download/testresource/CHANGELOG.md',
	);
}

export default spawnInstall;
