abstract class Transport {
	handleMessage!: (args: unknown[]) => void;

	abstract open(): Promise<void>;

	abstract send(message: string): void;
}

export default Transport;
