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

import args from 'args';
import path from 'path';

const mockArgs = jest.genMockFromModule('args');
(mockArgs as typeof args).parse = jest.fn(() => {
  return {
    publicFolder: path.join(__dirname, 'src/__mocks__/dashboard'),
  };
});

export default mockArgs;
