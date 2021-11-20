import axios from 'axios';
import fs from 'fs';

async function downloadFileToDisk(target: string, source: string): Promise<void> {
	const { data } = await axios.get(source, { responseType: 'stream' });
	const file = fs.createWriteStream(target);
	data.pipe(file);
	return new Promise((resolve) => file.on('close', resolve));
}

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

export { downloadFileToDisk, replaceInFile, remove };
