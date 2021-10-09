/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { InversifyBinding } from '@eclipse-che/che-theia-devworkspace-handler/lib/inversify/inversify-binding';
import { CheTheiaPluginsDevfileResolver } from '@eclipse-che/che-theia-devworkspace-handler/lib/devfile/che-theia-plugins-devfile-resolver';
import common from '@eclipse-che/common';
import { injectable } from 'inversify';
import { IDevWorkspaceEditorProcess, IDevWorkspaceEditorProcessingContext } from './devWorkspaceClient';

/**
 * This class manages what needs to be added on devfile/devworkspace template for Che-Theia
 */
@injectable()
export class DevWorkspaceEditorProcessTheia implements IDevWorkspaceEditorProcess {

    /**
     * Match if the editor metadata name contains the name theia
     */
    match(context: IDevWorkspaceEditorProcessingContext): boolean {
        return context.editorsDevfile.some(editor => editor.metadata.name.toLowerCase().includes('theia'));
    }

    /**
     * Do the theia stuff
     */
    public async apply(context: IDevWorkspaceEditorProcessingContext): Promise<void> {
        console.log('DevWorkspaceEditorProcessTheia: Applying CheTheia processor on top of the Devfile.');
        // call theia library to insert all the logic
        const inversifyBindings = new InversifyBinding();
        const container = await inversifyBindings.initBindings({
            pluginRegistryUrl: context.pluginRegistryUrl || '',
            axiosInstance: context.axios,
            insertTemplates: false,
        });
        const cheTheiaPluginsContent = context.optionalFilesContent['.che/che-theia-plugins.yaml'];
        const vscodeExtensionsJsonContent = context.optionalFilesContent['.vscode/extensions.json'];

        const cheTheiaPluginsDevfileResolver = container.get(CheTheiaPluginsDevfileResolver);

        // call library to update devWorkspace and add optional templates
        try {
            await cheTheiaPluginsDevfileResolver.handle({
                devfile: context.devfile,
                cheTheiaPluginsContent,
                vscodeExtensionsJsonContent,
                devWorkspace: context.devWorkspace,
                devWorkspaceTemplates: context.devWorkspaceTemplates,
                suffix: context.workspaceId,
            });
        } catch (e) {
            console.error(e);
            const errorMessage = common.helpers.errors.getMessage(e);
            throw new Error(`Unable to resolve theia plugins: ${errorMessage}`);
        }
    }
}
