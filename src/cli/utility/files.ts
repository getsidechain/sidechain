import fs from 'fs';

function replaceInFile(file: string, pattern: string | RegExp, substitution: string): void {
	const text = fs.readFileSync(file).toString();
	fs.writeFileSync(file, text.replace(pattern, substitution));
}

function remove(path: string): void {
	fs.rmSync(path, { recursive: true });
}

export { replaceInFile, remove };
