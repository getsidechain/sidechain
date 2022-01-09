import Transport from './Transport';

class NativeTransport extends Transport {
	open(): Promise<void> {
		// Implemented by SDK
		// @ts-expect-error
		window.bounce.onMessage = (args) => this.handleMessage(args);
		return Promise.resolve();
	}

	send(message: string): void {
		// Implemented by SDK
		// @ts-expect-error
		window.bounce.postMessage(message);
	}
}

export default NativeTransport;
