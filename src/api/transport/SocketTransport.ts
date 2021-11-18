import Transport from './Transport';

class SocketTransport extends Transport {
	socket!: WebSocket;

	open(): Promise<void> {
		return new Promise((resolve) => {
			this.socket = new WebSocket('ws://127.0.0.1:7777');
			this.socket.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
			this.socket.onopen = () => resolve();
		});
	}

	send(message: string): void {
		this.socket.send(message);
	}
}

export default SocketTransport;
