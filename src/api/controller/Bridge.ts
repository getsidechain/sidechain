import NativeTransport from '../transport/NativeTransport';
import SocketTransport from '../transport/SocketTransport';
import Transport from '../transport/Transport';

export type VarArs = unknown[];

export type Handler<Args extends VarArs, Result> = (...args: Args) => Result;

export type OpaqueHandler = Handler<unknown[], unknown>;

export type PromiseHandle = {
	resolve: OpaqueHandler;
	reject: (message: string) => void;
};

/**
 * Bridge implements low-level functionnalities
 * required for calling code between languages.
 *
 * It should not be used directly
 * but can be used from {@link Controller.bridge | Controller.bridge}.
 */
class Bridge {
	private transport!: Transport;

	private pendingCalls: { [key: string]: PromiseHandle } = {};

	private handlers: { [key: string]: OpaqueHandler } = {};

	/**
	 * Initiates the bridge's underlying transport
	 * and indicate backend that the bridge
	 * is ready to receive messages.
	 *
	 * This should not be called directly
	 * but is called from {@link Controller.initialize | Controller.initialize()}.
	 */
	async open(): Promise<void> {
		if ('sidechain' in window) {
			this.transport = new NativeTransport();
		} else {
			this.transport = new SocketTransport();
		}

		this.transport.handleMessage = (args) => this.handleMessage(args);
		await this.transport.open();
		this.call('handleBridgeReady');
	}

	/**
	 * Register a JavaScript function that can be called from the C++ side.
	 *
	 * You can register JavaScript callbacks anytime, anywhere -
	 * but a good starting point would be to extend the `Controller` class
	 * and override the `initialize()` method to register your custom functions.
	 *
	 * If `callback` returns `undefined`, the C++ callback will never be executed.
	 * This way you can reduce overhead when making one-way calls,
	 * as returning values requires additional processing.
	 *
	 * @param name Name of the procedure.
	 * @param handler Callback that will be invoked with the C++ arguments.
	 */
	register<Args extends VarArs, Result>(name: string, handler: Handler<Args, Result>): void {
		// TODO: remove me
		// @ts-expect-error
		this.handlers[name] = handler;
	}

	/**
	 * Call a registered C++ function without expecting a result.
	 * This call is synchronous and doesn't return anything even if the C++ does.
	 *
	 * @param name Name of the procedure to call.
	 * @param args Arbitrary arguments that will be passed to the C++ callback.
	 */
	call(name: string, ...args: unknown[]): void {
		this.send('call', name, ...args);
	}

	/**
	 * Call a C++ function expecting a result.
	 *
	 * @param name Name of the procedure to call.
	 * @param args Arbitrary arguments that will be passed to the C++ callback
	 * @returns A promise that will resolve with the C++ return value, if any,
	 * and reject if the C++ throws. The promise will never resolve if the C++
	 * returns a null-like value.
	 */
	callWithResult<Result>(name: string, ...args: unknown[]): Promise<Result> {
		return new Promise<Result>((resolve, reject) => {
			if (this.pendingCalls[name]) {
				this.pendingCalls[name].reject(`dangling async call with backend: ${name}`);
			}

			this.pendingCalls[name] = {
				// TODO: remove me
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

						this.send('resolve', method, result);
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
				this.pendingCalls[method].resolve(...args.slice(2));
				delete this.pendingCalls[method];
				break;

			case 'reject':
				if (this.pendingCalls[method]) {
					this.pendingCalls[method].reject(args[2] as string);
					delete this.pendingCalls[method];
				} else {
					throw new Error(args[2] as string);
				}
				break;

			default:
		}
	}
}

export default Bridge;
