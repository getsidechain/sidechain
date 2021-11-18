import BaseBridge from './BaseBridge';

type ParamID = number;

type ParamName = string;

type ParamValue = number;

type ControlerState = unknown;

type ControllerEvents = {
	setComponentState: (state: ControlerState) => void;
	setState: (state: ControlerState) => void;
	setParamNormalized: (tag: ParamID, value: ParamValue) => void;
};

class Bridge<State extends {}> extends BaseBridge<ControllerEvents> {
	constructor(public state: State) {
		super();
	}

	editParameter(name: ParamName, value: ParamValue): void {
		this.call('editParameter', 42, value);
	}
}

export default Bridge;
