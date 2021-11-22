import fs from 'fs';
import os from 'os';
import path from 'path';

import spawnQuicktype, { writeMultiSourceFile } from '../../utility/quicktype';
import { ParameterConfig } from '../../../api/schemas/ParameterConfig';
import { replaceInFile } from '../../utility/files';

type GenerateParametersArgs = {
	path: string;
	output: string;
};

async function spawnGenerateParameters(args: GenerateParametersArgs): Promise<void> {
	const module = await import(path.resolve(args.path));
	const parameters = module.default as { [name: string]: ParameterConfig };

	const tsUnion = `type Parameter = ${Object.keys(parameters)
		.map((name) => `'${name}'`)
		.join('|')}`;

	const tempFile = `${os.tmpdir()}/studiobridge_parameters.ts`;
	fs.writeFileSync(tempFile, tsUnion);

	const output = await spawnQuicktype(
		'-l',
		'c++',
		'--include-location',
		'global-include',
		'--enum-type',
		'unsigned int',
		'--wstring',
		'use-wstring',
		'--source-style',
		'multi-source',
		'--namespace',
		'Parameter',
		tempFile,
	);

	writeMultiSourceFile(output, args.output);

	const parameterHpp = path.join(path.resolve(args.output), 'ParameterSchema.hpp');
	replaceInFile(parameterHpp, /enum class/gu, 'enum');
	fs.appendFileSync(
		parameterHpp,
		`
namespace Schema {
	class ParametersConfig {
	public:
		static inline char const RawConfig[] = ${JSON.stringify(JSON.stringify(parameters))};
	};
}
		`,
	);
}

export default spawnGenerateParameters;
