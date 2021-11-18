import EventEmitter from 'events';
import TypedEventEmitter from 'typed-emitter';

import NativeTransport from '../transport/NativeTransport';
import SocketTransport from '../transport/SocketTransport';
import Transport from '../transport/Transport';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type VarArs = any[];

type Handler<Args extends VarArs, Result> = (...args: Args) => Result;

type OpaqueHandler = Handler<unknown[], unknown>;

type PromiseHandle = {
	resolve: OpaqueHandler;
	reject: (message: string) => void;
};

class BaseBridge<Events extends {}> extends (EventEmitter as { new <Events>(): TypedEventEmitter<Events> })<Events> {
	private transport!: Transport;

	private pendingCalls: { [key: string]: PromiseHandle } = {};

	private handlers: { [key: string]: OpaqueHandler } = {};

	async open(): Promise<void> {
		if ('studiobridge' in window) {
			this.transport = new NativeTransport();
		} else {
			this.transport = new SocketTransport();
		}

		this.transport.handleMessage = (args) => this.handleMessage(args);
		await this.transport.open();
		this.call('handleBridgeReady');
	}

	register<Args extends VarArs, Result>(name: string, handler: Handler<Args, Result>): void {
		// @ts-expect-error
		this.handlers[name] = handler;
	}

	call(name: string, ...args: unknown[]): void {
		this.send('call', name, ...args);
	}

	callWithResult<Result>(name: string, ...args: unknown[]): Promise<Result> {
		return new Promise<Result>((resolve, reject) => {
			if (this.pendingCalls[name]) {
				this.pendingCalls[name].reject(`dangling async call with backend: ${name}`);
			}

			this.pendingCalls[name] = {
				// @ts-expect-error
				resolve,
				reject: (message) => reject(new Error(message)),
			};

			this.call(name, ...args);
		});
	}

	private send(...args: unknown[]): void {
		this.transport.send(JSON.stringify(args));
	}

	private handleMessage(args: unknown[]): void {
		if (args.length < 2) {
			return;
		}

		const method = args[1] as string;
		switch (args[0] as string) {
			case 'call':
				const fn = this.handlers[method];
				if (typeof fn === 'function') {
					try {
						const result = fn(...args.slice(2));
						if (result === undefined) {
							return;
						}

						if (Array.isArray(result)) {
							this.send('resolve', method, ...result);
						} else {
							this.send('resolve', method, result);
						}
					} catch (error) {
						if (error instanceof Error) {
							this.send('reject', method, error.message);
						} else {
							this.send('reject', method, error);
						}
					}
				}
				break;

			case 'resolve':
				this.pendingCalls[method].resolve(args.slice(2));
				delete this.pendingCalls[method];
				break;

			case 'reject':
				this.pendingCalls[method].reject(args[2] as string);
				delete this.pendingCalls[method];
				break;

			default:
		}
	}
}

export default BaseBridge;
