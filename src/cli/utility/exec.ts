import { spawn } from 'child_process';

function executeShell(command: string): Promise<void> {
	const [binary, ...args] = command.split(' ');

	return new Promise((resolve, reject) => {
		const process = spawn(binary, args, {
			stdio: 'inherit',
		});

		process.on('close', (code) => {
			if (code) {
				reject(new Error(`command exited with non-zero code ${code}`));
				return;
			}

			resolve();
		});
	});
}

export default executeShell;
