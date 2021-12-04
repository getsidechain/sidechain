import fs from 'fs';
import path from 'path';
import { constantCase } from 'change-case';

import spawnQuicktype, { writeMultiSourceFile } from '../../utility/quicktype';
import { ParameterConfig } from '../../../api/schemas/ParameterConfig';
import { replaceInFile } from '../../utility/files';

type GenerateParametersArgs = {
	path: string;
	output: string;
};

async function spawnGenerateParameters(args: GenerateParametersArgs): Promise<void> {
	const module = await import(path.resolve(args.path));

	let parameters: { [name: string]: ParameterConfig };
	if (typeof module.default === 'function') {
		parameters = await module.default();
	} else {
		parameters = module.default;
	}

	const tsUnion = `
type Parameter = ${Object.keys(parameters)
		.map((name) => `'${name}'`)
		.join('|')}

export default Parameter;
	`;

	const tsEnumFilePath = path.join(path.resolve(args.output), 'Parameter.ts');
	fs.writeFileSync(tsEnumFilePath, tsUnion);

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
		'Schema',
		tsEnumFilePath,
	);
	writeMultiSourceFile(output, args.output, ['helper.hpp']);

	const parameterHpp = path.join(path.resolve(args.output), 'ParameterSchema.hpp');
	replaceInFile(parameterHpp, /enum class/gu, 'enum');
	replaceInFile(parameterHpp, /namespace Schema/gu, 'namespace Parameter');
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

	Object.keys(parameters).forEach((parameter, index) =>
		replaceInFile(parameterHpp, constantCase(parameter), `${constantCase(parameter)} = ${index}`),
	);

	replaceInFile(
		path.join(path.resolve(args.output), 'Parameter.hpp'),
		/Schema::Parameter/gu,
		'Parameter::Parameter',
	);
}

export default spawnGenerateParameters;
