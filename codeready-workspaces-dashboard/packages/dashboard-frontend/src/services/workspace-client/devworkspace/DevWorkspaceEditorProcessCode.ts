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

import { InversifyBinding } from '@eclipse-che/che-code-devworkspace-handler/lib/inversify/inversify-binding';
import { CheCodeDevfileResolver } from '@eclipse-che/che-code-devworkspace-handler/lib/api/che-code-devfile-resolver';
import common from '@eclipse-che/common';
import { injectable } from 'inversify';
import {
  IDevWorkspaceEditorProcess,
  IDevWorkspaceEditorProcessingContext,
} from './devWorkspaceClient';

/**
 * This class manages what needs to be added on devfile/devworkspace template for Che-Code
 */
@injectable()
export class DevWorkspaceEditorProcessCode implements IDevWorkspaceEditorProcess {
  /**
   * Match if the editor metadata name contains the name theia
   */
  match(context: IDevWorkspaceEditorProcessingContext): boolean {
    return context.editorsDevfile.some(editor =>
      editor.metadata.name.toLowerCase().includes('che-code'),
    );
  }

  /**
   * Do the theia stuff
   */
  public async apply(context: IDevWorkspaceEditorProcessingContext): Promise<void> {
    console.log(
      'DevWorkspaceEditorProcessTheia: Applying CheCode processor on top of the Devfile.',
    );
    // call che-code library to insert all the logic
    const inversifyBindings = new InversifyBinding();
    const container = await inversifyBindings.initBindings({
      insertDevWorkspaceTemplatesAsPlugin: false,
    });

    const cheCodeDevfileResolver = container.get(CheCodeDevfileResolver);

    // call library to update devWorkspace and add optional templates
    try {
      await cheCodeDevfileResolver.update({
        devfile: context.devfile,
        devWorkspace: context.devWorkspace,
        devWorkspaceTemplates: context.devWorkspaceTemplates,
        suffix: context.workspaceId,
      });
    } catch (e) {
      console.error(e);
      const errorMessage = common.helpers.errors.getMessage(e);
      throw new Error(`Unable to resolve che-code plugins: ${errorMessage}`);
    }
  }
}
