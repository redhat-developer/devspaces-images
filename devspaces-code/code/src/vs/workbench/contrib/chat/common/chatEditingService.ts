/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event } from '../../../../base/common/event.js';
import { IObservable, ITransaction } from '../../../../base/common/observable.js';
import { URI } from '../../../../base/common/uri.js';
import { TextEdit } from '../../../../editor/common/languages.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { IChatResponseModel } from './chatModel.js';

export const IChatEditingService = createDecorator<IChatEditingService>('chatEditingService');

export interface IChatEditingService {
	_serviceBrand: undefined;

	readonly onDidCreateEditingSession: Event<IChatEditingSession>;

	readonly currentEditingSession: IChatEditingSession | null;

	startOrContinueEditingSession(chatSessionId: string, options?: { silent: boolean }): Promise<IChatEditingSession>;
	addFileToWorkingSet(resource: URI): Promise<void>;
	triggerEditComputation(responseModel: IChatResponseModel): Promise<void>;
}

export interface IChatEditingSession {
	readonly chatSessionId: string;
	readonly onDidChange: Event<void>;
	readonly onDidDispose: Event<void>;
	readonly state: IObservable<ChatEditingSessionState>;
	readonly workingSet: IObservable<readonly URI[]>;
	readonly entries: IObservable<readonly IModifiedFileEntry[]>;
	readonly isVisible: boolean;
	show(): Promise<void>;
	accept(...uris: URI[]): Promise<void>;
	reject(...uris: URI[]): Promise<void>;
	/**
	 * Will lead to this object getting disposed
	 */
	stop(): Promise<void>;
}

export const enum ModifiedFileEntryState {
	Undecided,
	Accepted,
	Rejected
}

export interface IModifiedFileEntry {
	readonly originalURI: URI;
	readonly modifiedURI: URI;
	readonly state: IObservable<ModifiedFileEntryState>;
	accept(transaction: ITransaction | undefined): Promise<void>;
	reject(transaction: ITransaction | undefined): Promise<void>;
}

export interface IChatEditingSessionStream {
	textEdits(resource: URI, textEdits: TextEdit[]): void;
}

export const enum ChatEditingSessionState {
	Initial = 0,
	StreamingEdits = 1,
	Idle = 2,
	Disposed = 3
}
