import fs from 'fs';

function replaceInFile(file: string, pattern: string | RegExp, substitution: string): void {
	const text = fs.readFileSync(file).toString();
	fs.writeFileSync(file, text.replace(pattern, substitution));
}

function remove(path: string): Promise<void> {
	return new Promise((resolve, reject) => {
		fs.rm(path, { recursive: true }, (error) => {
			if (error) {
				reject(error);
				return;
			}

			resolve();
		});
	});
}

export { replaceInFile, remove };
