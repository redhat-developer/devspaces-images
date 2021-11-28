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

export const dockerConfigExample = {
  get dockerconfig() {
    const registry = 'quay.io';
    const username = 'janedoe';
    const password = 'xxxxxxxxxxxxxxxxxxxxxxx';
    const auth = new Buffer(`${username}:${password}`).toString('base64');
    const buff = new Buffer(
      JSON.stringify({
        auths: {
          [registry]: { auth },
        },
      }),
    );
    return buff.toString('base64');
  },
};
