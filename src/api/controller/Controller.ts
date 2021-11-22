import EventEmitter from 'events';
import TypedEventEmitter from 'typed-emitter';

import Bridge from './Bridge';
import { Enum, enumEntries } from '../utility/enum';
import { ParameterConfig } from '../schemas/ParameterConfig';

export type ParameterTag = number;

export type ParameterValue = number;

export type ParametersValues<Parameter extends Enum> = {
	[key in Parameter]: ParameterValue;
};

export type ParametersConfig<Parameter extends Enum> = {
	[key in Parameter]: ParameterConfig;
};

export type ControllerConfig<Parameter extends Enum> = {
	parameters?: ParametersConfig<Parameter>;
	managedState?: boolean;
};

export type ControllerEvents<Parameter, State, ProcessorState> = {
	parameterUpdate: (name: Parameter, value: ParameterValue) => void;
	stateUpdate: (state: State) => void;
	processorStateUpdate: (state: ProcessorState) => void;
};

class Controller<Parameter extends Enum = '', State = {}, ProcessorState = {}> extends (EventEmitter as {
	new <Events>(): TypedEventEmitter<Events>;
})<ControllerEvents<Parameter, State, ProcessorState>> {
	state!: State;

	initialProcessorState!: ProcessorState;

	parameters = {} as ParametersValues<Parameter>;

	bridge = new Bridge();

	private tagsByName = {} as ParametersValues<Parameter>;

	private namesByTag = {} as { [tag: number]: Parameter };

	constructor(public config: ControllerConfig<Parameter>) {
		/* eslint-disable-next-line constructor-super */
		super();

		if (config.managedState === undefined) {
			config.managedState = true;
		}
	}

	async initialize(): Promise<void> {
		if (this.config.parameters) {
			enumEntries(this.config.parameters).forEach(([name, config], index) => {
				this.parameters[name] = config.defaultValue || 0;
				this.tagsByName[name] = index;
				this.namesByTag[index] = name;
			});

			this.bridge.register('updateParameter', (tag: ParameterTag, value: ParameterValue) => {
				const name = this.namesByTag[tag];
				this.parameters[name] = value;
				this.emit('parameterUpdate', name, value);
			});
		}

		if (this.config.managedState) {
			this.bridge.register('setState', (state: State) => {
				this.state = state;
				this.emit('stateUpdate', state);
			});
			this.bridge.register('setStateFromProcessorState', (state: ProcessorState) => {
				this.initialProcessorState = state;
				this.emit('processorStateUpdate', state);
			});
		}

		await this.bridge.open();

		if (this.config.managedState) {
			this.state = await this.bridge.callWithResult('getState');
			this.emit('stateUpdate', this.state);
		}
	}

	editParameter(name: Parameter, value: ParameterValue): void {
		this.bridge.call('editParameter', this.tagsByName[name], value);
		this.parameters[name] = value;
	}

	updateState(changes: Partial<State>): void {
		Object.assign(this.state, changes);
		this.bridge.call('setState', this.state);
	}
}

export default Controller;
