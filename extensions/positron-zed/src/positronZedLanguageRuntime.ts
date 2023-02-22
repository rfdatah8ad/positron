/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2022 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import * as positron from 'positron';

/**
 * PositronZedLanguageRuntime.
 */
export class PositronZedLanguageRuntime implements positron.LanguageRuntime {
	//#region Private Properties

	/**
	 * Gets the help lines.
	 */
	private readonly _helpLines = [
		'Zed help:',
		'help        - Shows help',
		'error       - Simulates a one line error message',
		'traceback   - Simulates a one line error message with a two line traceback',
		'version     - Shows the Zed version'
	].join('\n');

	/**
	 * The onDidReceiveRuntimeMessage event emitter.
	 */
	private readonly _onDidReceiveRuntimeMessage = new vscode.EventEmitter<positron.LanguageRuntimeMessage>();

	/**
	 * The onDidChangeRuntimeState event emitter.
	 */
	private readonly _onDidChangeRuntimeState = new vscode.EventEmitter<positron.RuntimeState>();

	/**
	 * A history of executed commands
	 */
	private readonly _history: string[][] = [];

	//#endregion Private Properties

	//#region Constructor

	/**
	 * Constructor.
	 * @param runtimeId The ID for the new runtime
	 * @param version The language version.
	 */
	constructor(runtimeId: string, version: string) {
		this.metadata = {
			runtimeId,
			languageId: 'zed',
			languageName: 'Zed',
			runtimeName: 'Zed',
			languageVersion: version,
			runtimeVersion: '0.0.1',
			startupBehavior: positron.LanguageRuntimeStartupBehavior.Implicit
		};
	}

	//#endregion Constructor

	//#region LanguageRuntime Implementation

	/**
	 * Gets the metadata for the language runtime.
	 */
	readonly metadata: positron.LanguageRuntimeMetadata;

	/**
	 * An object that emits language runtime events.
	 */
	onDidReceiveRuntimeMessage: vscode.Event<positron.LanguageRuntimeMessage> = this._onDidReceiveRuntimeMessage.event;

	/**
	 * An object that emits he current state of the runtime.
	 */
	onDidChangeRuntimeState: vscode.Event<positron.RuntimeState> = this._onDidChangeRuntimeState.event;

	/**
	 * Execute code in the runtime.
	 * @param code The code to exeucte.
	 * @param id The ID of the operation.
	 * @param mode The execution mode to conform to.
	 * @param errorBehavior The error behavior to conform to.
	 */
	execute(code: string, id: string, mode: positron.RuntimeCodeExecutionMode, errorBehavior: positron.RuntimeErrorBehavior): void {

		// Process the "code".
		switch (code) {
			case 'help':
				this.simulateSuccessfulCodeExecution(code, this._helpLines);
				return;

			case 'error':
				this.simulateUnsuccessfulCodeExecution(code, 'Simulated Error', `Simulated error message`, []);
				break;

			case 'traceback':
				this.simulateUnsuccessfulCodeExecution(code, 'Simulated Error', `Simulated error message`, ['Traceback line 1', 'Traceback line 2']);
				break;

			case 'version':
				this.simulateSuccessfulCodeExecution(code, `Zed v${this.metadata.languageVersion} (${this.metadata.runtimeId})`);
				return;

			default:
				this.simulateUnsuccessfulCodeExecution(code, 'Unknown Command', `Error. '${code}' not recognized.`, []);
				return;
		}
	}

	/**
	 * Tests a code fragment to see if it's complete.
	 * @param code The code to test for completeness.
	 * @returns A Thenable that resolves with the status of the code fragment.
	 */
	isCodeFragmentComplete(code: string): Thenable<positron.RuntimeCodeFragmentStatus> {
		const parentId = randomUUID();
		this.simulateBusyState(parentId);
		this.simulateIdleState(parentId);
		return Promise.resolve(positron.RuntimeCodeFragmentStatus.Complete);
	}

	/**
	 * Create a new instance of a client.
	 * @param type The runtime client type.
	 */
	createClient(type: positron.RuntimeClientType): string {
		throw new Error('Method not implemented.');
	}

	/**
	 * Removes an instance of a client.
	 */
	removeClient(id: string): void {
		throw new Error('Method not implemented.');
	}

	/**
	 * Send a message to the client instance.
	 * @param id The ID of the message.
	 * @param message The message.
	 */
	sendClientMessage(id: string, message: any): void {
		throw new Error('Method not implemented.');
	}

	/**
	 * Replies to a prompt issued by the runtime.
	 * @param id The ID of the prompt.
	 * @param reply The reply of the prompt.
	 */
	replyToPrompt(id: string, reply: string): void {
		throw new Error('Method not implemented.');
	}

	/**
	 * Starts the runtime; returns a Thenable that resolves with information about the runtime.
	 * @returns A Thenable that resolves with information about the runtime
	 */
	start(): Promise<positron.LanguageRuntimeInfo> {
		this._onDidChangeRuntimeState.fire(positron.RuntimeState.Ready);
		return Promise.resolve({
			banner: `Zed ${this.metadata.languageVersion} `,
			implementation_version: this.metadata.runtimeVersion,
			language_version: this.metadata.languageVersion,
		} as positron.LanguageRuntimeInfo);
	}

	/**
	 * Interrupts the runtime.
	 */
	interrupt(): void {
		throw new Error('Method not implemented.');
	}

	/**
	 * Restarts the runtime.
	 */
	restart(): void {
		throw new Error('Method not implemented.');
	}

	/**
	 * Shuts down the runtime.
	 */
	shutdown(): void {
		throw new Error('Method not implemented.');
	}

	//#endregion LanguageRuntime Implementation

	//#region Private Methods

	/**
	 * Simulates successful code execution.
	 * @param code The code.
	 * @param output The output from the code.
	 */
	private simulateSuccessfulCodeExecution(code: string, output: string) {
		const parentId = randomUUID();
		this.simulateBusyState(parentId);
		this.simulateInputMessage(parentId, code);
		this._history.push([code, output]);
		this.simulateOutputMessage(parentId, output);
		this.simulateIdleState(parentId);
	}

	/**
	 * Simulates unsuccessful code execution.
	 * @param code The code.
	 * @param name The error name.
	 * @param message The error message.
	 * @param traceback The error traceback.
	 */
	private simulateUnsuccessfulCodeExecution(code: string, name: string, message: string, traceback: string[]) {
		const parentId = randomUUID();
		this.simulateBusyState(parentId);
		this.simulateInputMessage(parentId, code);
		this.simulateErrorMessage(parentId, name, message, traceback);
		this.simulateIdleState(parentId);
	}

	/**
	 * Simulates transitioning to the busy state.
	 * @param parentId The parent identifier.
	 */
	private simulateBusyState(parentId: string) {
		this._onDidReceiveRuntimeMessage.fire({
			id: randomUUID(),
			parent_id: parentId,
			when: new Date().toISOString(),
			type: positron.LanguageRuntimeMessageType.State,
			state: positron.RuntimeOnlineState.Busy
		} as positron.LanguageRuntimeState);
		this._onDidChangeRuntimeState.fire(positron.RuntimeState.Busy);
	}

	/**
	 * Simulates transitioning to the idle state.
	 * @param parentId The parent identifier.
	 */
	private simulateIdleState(parentId: string) {
		this._onDidReceiveRuntimeMessage.fire({
			id: randomUUID(),
			parent_id: parentId,
			when: new Date().toISOString(),
			type: positron.LanguageRuntimeMessageType.State,
			state: positron.RuntimeOnlineState.Idle
		} as positron.LanguageRuntimeState);
		this._onDidChangeRuntimeState.fire(positron.RuntimeState.Idle);
	}

	/**
	 * Simulates sending an input message.
	 * @param parentId The parent identifier.
	 * @param code The code.
	 */
	private simulateInputMessage(parentId: string, code: string) {
		this._onDidReceiveRuntimeMessage.fire({
			id: randomUUID(),
			parent_id: parentId,
			when: new Date().toISOString(),
			type: positron.LanguageRuntimeMessageType.Input,
			state: positron.RuntimeOnlineState.Busy,
			code: code,
			execution_count: 1
		} as positron.LanguageRuntimeInput);
	}

	/**
	 * Simulates sending an output message.
	 * @param parentId The parent identifier.
	 * @param output The output.
	 */
	private simulateOutputMessage(parentId: string, output: string) {
		this._onDidReceiveRuntimeMessage.fire({
			id: randomUUID(),
			parent_id: parentId,
			when: new Date().toISOString(),
			type: positron.LanguageRuntimeMessageType.Output,
			data: {
				'text/plain': output
			} as any,
		} as positron.LanguageRuntimeOutput);
	}

	/**
	 * Simulates sending an error message.
	 * @param parentId The parent identifier.
	 * @param name The name.
	 * @param message The message.
	 * @param traceback The traceback.
	 */
	private simulateErrorMessage(parentId: string, name: string, message: string, traceback: string[]) {
		this._onDidReceiveRuntimeMessage.fire({
			id: randomUUID(),
			parent_id: parentId,
			when: new Date().toISOString(),
			type: positron.LanguageRuntimeMessageType.Error,
			name,
			message,
			traceback
		} as positron.LanguageRuntimeError);
	}

	//#endregion Private Methods
}
