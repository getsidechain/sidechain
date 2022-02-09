import { SpawnOptions, spawn } from 'child_process';

function executeBinaryWithOptions(
	binary: string,
	args: string[],
	silent: boolean,
	options?: SpawnOptions,
): Promise<string> {
	let stdout = '';
	let stderr = '';

	return new Promise((resolve, reject) => {
		const process = spawn(binary, args, options || {});

		process.stdout?.on('data', (data) => (stdout += data.toString()));
		if (!silent) {
			process.stderr?.on('data', (data) => (stderr += data.toString()));
		}

		process.on('close', (code) => {
			if (!silent && stderr) {
				console.info(stderr.trimEnd());
			}

			if (code) {
				reject(new Error(`command exited with non-zero code ${code}`));
				return;
			}

			resolve(stdout);
		});
	});
}

function executeBinarySilent(binary: string, ...args: string[]): Promise<string> {
	return executeBinaryWithOptions(binary, args, true);
}

function executeBinary(binary: string, ...args: string[]): Promise<string> {
	return executeBinaryWithOptions(binary, args, false);
}

export default executeBinary;
export { executeBinarySilent, executeBinaryWithOptions };
