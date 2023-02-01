/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

function isDocumentReady(): Promise<void> {
  return new Promise<void>(resolve => {
    const state = document.readyState;
    if (state === 'interactive' || state === 'complete') {
      resolve();
    } else {
      document.onreadystatechange = (): void => resolve();
    }
  });
}

export default isDocumentReady;
