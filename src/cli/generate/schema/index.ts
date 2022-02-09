import path from 'path';

import spawnQuicktype, { writeMultiSourceFile } from '../../utility/quicktype';

type GenerateSchemaArgs = {
	output: string;
	paths: string[];
	namespace?: string;
};

async function spawnGenerateSchema(args: GenerateSchemaArgs): Promise<void> {
	const namespace = args.namespace || 'Schema';

	if (!args.paths) {
		throw new Error('at least one source file must be specified');
	}

	for (const source of args.paths) {
		const code = await spawnQuicktype(
			'-l',
			'c++',
			'--include-location',
			'global-include',
			'--enum-type',
			'unsigned int',
			'--source-style',
			'multi-source',
			'--namespace',
			namespace,
			path.resolve(source),
		);

		writeMultiSourceFile(code, args.output, namespace);
	}
}

export default spawnGenerateSchema;
