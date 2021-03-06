import fs from 'fs';
import path from 'path';
import { ParameterConfig } from '@foobartestxyz/core';
import { constantCase } from 'change-case';

import spawnQuicktype, { writeMultiSourceFile } from '../../utility/quicktype';
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
export type Parameter = ${
		Object.keys(parameters)
			.map((name) => `'${name}'`)
			.join('|') || "'never'"
	}

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
		'--source-style',
		'multi-source',
		'--namespace',
		'Schema',
		tsEnumFilePath,
	);
	writeMultiSourceFile(output, args.output, 'Schema', ['helper.hpp']);

	const parameterSchemaHpp = path.join(path.resolve(args.output), 'ParameterSchema.hpp');
	replaceInFile(parameterSchemaHpp, /enum class/gu, 'enum');
	replaceInFile(parameterSchemaHpp, /namespace Schema/gu, 'namespace Parameter');
	fs.appendFileSync(
		parameterSchemaHpp,
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
		replaceInFile(
			parameterSchemaHpp,
			constantCase(parameter),
			`${constantCase(parameter)} = ${index}`,
		),
	);

	const parametersHpp = path.join(path.resolve(args.output), 'Parameter.hpp');
	replaceInFile(parametersHpp, /Schema::Parameter/gu, 'Parameter::Parameter');
}

export default spawnGenerateParameters;
