import executeShell from '../utility/exec';
import { remove } from '../utility/files';

type NewArgs = {
	name: string;
};

async function spawnNew(args: NewArgs): Promise<void> {
	await executeShell(`git clone -q git@github.com:getstudiobridge/test.git ${args.name}`);
	await remove(`${args.name}/.git`);
}

export default spawnNew;
