export type Enum = string;

function enumKeys<T>(input: T): (keyof T)[] {
	return Object.keys(input) as (keyof T)[];
}

function enumEntries<T>(input: T): [keyof T, T[keyof T]][] {
	return Object.entries(input) as [keyof T, T[keyof T]][];
}

export { enumKeys, enumEntries };
