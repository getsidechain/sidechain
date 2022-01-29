import { TypedEmitter } from 'tiny-typed-emitter';

import Bridge from './Bridge';
import { Enum, enumEntries } from '../utility/enum';
import { ParameterConfig } from '../schemas/ParameterConfig';

export type ParameterID = number;

export type ParameterValue = number;

/**
 * Key / value map containing all parameters values.
 */
export type ParametersValues<Parameter extends Enum = string> = {
	[key in Parameter]: ParameterValue;
};

/**
 * Parameters configuration map,
 * corresponding to the format of the `parameters.json` file.
 */
export type ParametersConfig<Parameter extends Enum = string> = {
	[key in Parameter]: ParameterConfig;
};

/**
 * Main configuration for the JavaScript controller.
 */
export type ControllerConfig<Parameter extends Enum = string> = {
	parameters?: ParametersConfig<Parameter>;
	managedState?: boolean;
};

export type ControllerEvents<Parameter, State, ProcessorState> = {
	parameterUpdate: (name: Parameter, value: ParameterValue) => void;
	stateUpdate: (state: State) => void;
	processorStateUpdate: (state: ProcessorState) => void;
};

/**
 * Controller implements high-level functionality
 * to interact with the C++ VST controller from JavaScript.
 * It should be instanciated used as a singleton.
 *
 * @param Parameter A TypeScript union with all the existing parmeter names.
 * This can be obtained from an object's keys by using `keyof typeof myObject`.
 * @param State State type definition.
 * @param ProcessorState ProcessorState type definition.
 */
class Controller<Parameter extends Enum = '', State = {}, ProcessorState = {}> extends TypedEmitter<
	ControllerEvents<Parameter, State, ProcessorState>
> {
	/**
	 * Always up-to-date controller state.
	 */
	state!: State;

	/**
	 * Processor state from last host update (may no be up to date).
	 */
	initialProcessorState!: ProcessorState;

	/**
	 * Always up-to-date parameters values.
	 */
	parameters = {} as ParametersValues<Parameter>;

	/**
	 * Bridge instance that can be used
	 * for creating custom cross-language callbacks.
	 */
	bridge = new Bridge();

	private tagsByName = {} as ParametersValues<Parameter>;

	private namesByTag = {} as { [tag: number]: Parameter };

	/**
	 * It is recommended to only have one {@link Controller | Controller}.
	 *
	 * @param config Controller configuration.
	 * The `managedState` boolean toggles [managed state functionality](https://TODO) (enabled by default).
	 * The `parameters` object refers to the contents of the `parameters.json` file.
	 */
	constructor(public config: ControllerConfig<Parameter>) {
		/* eslint-disable-next-line constructor-super */
		super();

		if (config.managedState === undefined) {
			config.managedState = true;
		}
	}

	/**
	 * Entry initialization function that should be called
	 * prior doing anything with the controller.
	 */
	async initialize(): Promise<void> {
		if (this.config.parameters) {
			enumEntries(this.config.parameters).forEach(([name, config], index) => {
				this.parameters[name] = config.defaultValue || 0;
				this.tagsByName[name] = index;
				this.namesByTag[index] = name;
			});

			this.bridge.register('updateParameter', (tag: ParameterID, value: ParameterValue) => {
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

		this.bridge.register('_blur', () =>
			Bridge.showDisconnectionError('This window is not connected to a running VST instance.'),
		);

		await this.bridge.open();

		if (this.config.managedState) {
			this.state = await this.bridge.callWithResult('getState');
			this.initialProcessorState = await this.bridge.callWithResult('getInitialProcessorState');
			this.emit('stateUpdate', this.state);
			this.emit('processorStateUpdate', this.initialProcessorState);
		}
	}

	/**
	 * Can be used to request a parameter change to the host.
	 *
	 * @param name Name of parameter to update.
	 * @param value New normalized float value.
	 */
	updateParameter(
		name: Parameter,
		value: ParameterValue | ((value: ParameterValue) => ParameterValue),
	): void {
		const resolvedValue = typeof value === 'function' ? value(this.parameters[name]) : value;
		this.bridge.call('updateParameter', this.tagsByName[name], resolvedValue);
		this.parameters[name] = resolvedValue;
	}

	/**
	 * Can be used to store persistent data.
	 * Everything that is passed to `updateState()`
	 * will be stored and restored when the host saves / loads
	 * the plugin's state.
	 *
	 * @param changes Modifications to merge with the current state.
	 */
	updateState(changes: Partial<State> | ((state: State) => Partial<State>)): void {
		const resolvedChanges = typeof changes === 'function' ? changes(this.state) : changes;
		Object.assign(this.state, resolvedChanges);
		this.bridge.call('setState', this.state);
		this.emit('stateUpdate', this.state);
	}
}

export default Controller;
