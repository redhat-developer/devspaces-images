/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DisposableMap } from '../../../base/common/lifecycle.js';
import { revive } from '../../../base/common/marshalling.js';
import { ExtHostChatVariablesShape, ExtHostContext, IChatVariableResolverProgressDto, MainContext, MainThreadChatVariablesShape } from '../common/extHost.protocol.js';
import { IChatRequestVariableValue, IChatVariableData, IChatVariableResolverProgress, IChatVariablesService } from '../../contrib/chat/common/chatVariables.js';
import { IExtHostContext, extHostNamedCustomer } from '../../services/extensions/common/extHostCustomers.js';

@extHostNamedCustomer(MainContext.MainThreadChatVariables)
export class MainThreadChatVariables implements MainThreadChatVariablesShape {

	private readonly _proxy: ExtHostChatVariablesShape;
	private readonly _variables = new DisposableMap<number>();
	private readonly _pendingProgress = new Map<string, (part: IChatVariableResolverProgress) => void>();

	constructor(
		extHostContext: IExtHostContext,
		@IChatVariablesService private readonly _chatVariablesService: IChatVariablesService,
	) {
		this._proxy = extHostContext.getProxy(ExtHostContext.ExtHostChatVariables);
	}

	dispose(): void {
		this._variables.clearAndDisposeAll();
	}

	$registerVariable(handle: number, data: IChatVariableData): void {
		const registration = this._chatVariablesService.registerVariable(data, async (messageText, _arg, model, progress, token) => {
			const varRequestId = `${model.sessionId}-${handle}`;
			this._pendingProgress.set(varRequestId, progress);
			const result = revive<IChatRequestVariableValue>(await this._proxy.$resolveVariable(handle, varRequestId, messageText, token));

			this._pendingProgress.delete(varRequestId);
			return result as any; // 'revive' type signature doesn't like this type for some reason
		});
		this._variables.set(handle, registration);
	}

	async $handleProgressChunk(requestId: string, progress: IChatVariableResolverProgressDto): Promise<number | void> {
		const revivedProgress = revive(progress);
		this._pendingProgress.get(requestId)?.(revivedProgress as IChatVariableResolverProgress);
	}

	$unregisterVariable(handle: number): void {
		this._variables.deleteAndDispose(handle);
	}
}
