import Transport from './Transport';

class SocketTransport extends Transport {
	socket!: WebSocket;

	open(): Promise<void> {
		return new Promise((resolve, reject) => {
			const address = 'ws://127.0.0.1:7777';
			this.socket = new WebSocket(address);
			this.socket.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
			this.socket.onopen = () => resolve();
			this.socket.onerror = () =>
				reject(
					new Error(
						`Could not connect to <code>"${address}"</code><br /><br /> Is the VST instance running and the window open?`,
					),
				);
		});
	}

	send(message: string): void {
		this.socket.send(message);
	}
}

export default SocketTransport;
