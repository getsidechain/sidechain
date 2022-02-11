import React, { Provider, useEffect, useState } from 'react';
import { Controller } from '@foobartestxyz/core';

type ProcessorStateProviderProps<Parameter extends string, State, ProcessorState> = {
	controller: Controller<Parameter, State, ProcessorState>;
	children: React.ReactNode;
	ContextProvider: Provider<ProcessorState>;
};

function ProcessorStateProvider<Parameter extends string, State, ProcessorState>({
	controller,
	children,
	ContextProvider,
}: ProcessorStateProviderProps<Parameter, State, ProcessorState>): JSX.Element {
	const [initialProcessorState, setInitialProcessorState] = useState(
		controller.initialProcessorState,
	);

	useEffect(() => {
		const handleProcessorStateChange = (state: ProcessorState) =>
			setInitialProcessorState({ ...state });
		controller.on('processorStateUpdate', handleProcessorStateChange);
		return () => void controller.off('processorStateUpdate', handleProcessorStateChange);
	});

	return <ContextProvider value={initialProcessorState}>{children}</ContextProvider>;
}

export default ProcessorStateProvider;
