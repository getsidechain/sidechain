import React, { Provider, useEffect, useState } from 'react';
import { Controller, ParameterValue, ParametersValues } from '@foobartestxyz/core';

type ControllerParametersProviderProps<Parameter extends string, State, ProcessorState> = {
	controller: Controller<Parameter, State, ProcessorState>;
	children: React.ReactNode;
	ContextProvider: Provider<ParametersValues<Parameter>>;
};

function ControllerParametersProvider<Parameter extends string, State, ProcessorState>({
	controller,
	children,
	ContextProvider,
}: ControllerParametersProviderProps<Parameter, State, ProcessorState>): JSX.Element {
	const [parameters, setParameters] = useState(controller.parameters);

	useEffect(() => {
		const handleParameterChange = (name: Parameter, value: ParameterValue) =>
			setParameters((parameters) => ({
				...parameters,
				[name]: value,
			}));

		controller.on('parameterUpdate', handleParameterChange);
		return () => void controller.off('parameterUpdate', handleParameterChange);
	});

	return <ContextProvider value={parameters}>{children}</ContextProvider>;
}

export default ControllerParametersProvider;
