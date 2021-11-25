/**
 * Configration to use when creating a managed parameter.
 */
export type ParameterConfig = {
	title: string;
	shortTitle: string;
	unit: string;
	stepCount: number;
	defaultValue: number;
	canAutomate: boolean;
	unitID: number;
};
