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

export const dockerConfigExample = {
  get dockerconfig() {
    const registry = 'https://index.docker.io/v1/';
    const username = 'janedoe';
    const password = 'xxxxxxxxxxxxxxxxxxxxxxx';
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    return Buffer.from(
      JSON.stringify({
        auths: {
          [registry]: {
            username,
            password,
            auth,
          },
        },
      }),
    ).toString('base64');
  },
};
