/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import React from 'react';

import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';

import { TextFileUploadPreview } from '..';

const { createSnapshot } = getComponentRenderer(getComponent);

const file = new File(['file content'], 'filename.txt', { type: 'text/plain' });

describe('TextFileUploadPreview', () => {
  test('snapshot', () => {
    const snapshot = createSnapshot();
    expect(snapshot.toJSON()).toMatchSnapshot();
  });
});

function getComponent(): JSX.Element {
  return <TextFileUploadPreview file={file} />;
}
