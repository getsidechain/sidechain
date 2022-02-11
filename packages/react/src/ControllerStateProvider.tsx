import React, { Provider, useEffect, useState } from 'react';
import { Controller } from '@foobartestxyz/core';

type ControllerStateProviderProps<Parameter extends string, State, ProcessorState> = {
	controller: Controller<Parameter, State, ProcessorState>;
	children: React.ReactNode;
	ContextProvider: Provider<State>;
};

function ControllerStateProvider<Parameter extends string, State, ProcessorState>({
	controller,
	children,
	ContextProvider,
}: ControllerStateProviderProps<Parameter, State, ProcessorState>): JSX.Element {
	const [state, setState] = useState(controller.state);

	useEffect(() => {
		const handleStateChange = (state: State) => setState({ ...state });
		controller.on('stateUpdate', handleStateChange);
		return () => void controller.off('stateUpdate', handleStateChange);
	});

	return <ContextProvider value={state}>{children}</ContextProvider>;
}

export default ControllerStateProvider;
