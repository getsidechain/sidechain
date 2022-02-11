import React, { createContext, useContext } from 'react';
import { Controller, ParametersValues } from '@foobartestxyz/core';

import ControllerParametersProvider from './ControllerParametersProvider';
import ControllerStateProvider from './ControllerStateProvider';
import ProcessorStateProvider from './ProcessorStateProvider';

export type ControllerProviderProps = {
	children: React.ReactNode;
};

export type ControllerProvider = React.FC<ControllerProviderProps>;

export type Hooks<Parameter extends string, State, ProcessorState> = {
	ControllerProvider: ControllerProvider;
	useControllerState: () => State;
	useProcessorState: () => ProcessorState;
	useControllerParameters: () => ParametersValues<Parameter>;
};

function createHooks<Parameter extends string, State, ProcessorState>(
	controller: Controller<Parameter, State, ProcessorState>,
): Hooks<Parameter, State, ProcessorState> {
	const stateContext = createContext(controller.state);
	const processorStateContext = createContext(controller.initialProcessorState);
	const parametersContext = createContext(controller.parameters);

	return {
		useControllerState: () => useContext(stateContext),
		useProcessorState: () => useContext(processorStateContext),
		useControllerParameters: () => useContext(parametersContext),
		ControllerProvider: ({ children }) => (
			<ControllerParametersProvider
				controller={controller}
				ContextProvider={parametersContext.Provider}
			>
				<ControllerStateProvider controller={controller} ContextProvider={stateContext.Provider}>
					<ProcessorStateProvider
						controller={controller}
						ContextProvider={processorStateContext.Provider}
					>
						{children}
					</ProcessorStateProvider>
				</ControllerStateProvider>
			</ControllerParametersProvider>
		),
	};
}

export default createHooks;
