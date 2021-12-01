import fs from 'fs';
import os from 'os';
import path from 'path';

import executeBinary from './exec';
import { replaceInFile } from './files';

function spawnQuicktype(...args: string[]): Promise<string> {
	return executeBinary(require.resolve('quicktype'), ...args);
}

function writeMultiSourceFile(code: string, directory: string, omit?: string[]): void {
	let typeName;
	const resolvedDirectory = path.resolve(directory);
	fs.rmSync(path.join(resolvedDirectory, 'Generators.hpp'), { force: true });

	code
		.replace(/\n\n\/\/ (?<name>.*)\n\n/gu, '\n\n__FILE__\n// $1\n\n')
		.split('__FILE__')
		.forEach((file) => {
			const lines = file.trimStart().split('\n');
			const filename = lines[0].replace('//', '').trimStart();

			if (path.extname(filename) !== '.hpp') {
				return;
			}

			const body = lines.slice(1).join(os.EOL);
			const outputPath = `${resolvedDirectory}/${filename}`;

			if (!omit?.includes(filename)) {
				fs.writeFileSync(outputPath, body);
			}

			if (filename !== 'Generators.hpp' && filename !== 'helper.hpp') {
				typeName = path.basename(filename, '.hpp');
			}
		});

	fs.renameSync(`${resolvedDirectory}/${typeName}.hpp`, `${resolvedDirectory}/${typeName}Schema.hpp`);
	fs.renameSync(`${resolvedDirectory}/Generators.hpp`, `${resolvedDirectory}/${typeName}.hpp`);
	replaceInFile(
		`${resolvedDirectory}/${typeName}.hpp`,
		`#include "${typeName}.hpp"`,
		`#include "${typeName}Schema.hpp"`,
	);
}

export default spawnQuicktype;
export { writeMultiSourceFile };
