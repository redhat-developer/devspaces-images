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

import { Props, TagLabel } from '@/components/TagLabel';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';

const { createSnapshot } = getComponentRenderer(getComponent);

describe('TagLabel component', () => {
  test('snapshot type version', () => {
    const snapshot = createSnapshot({ text: 'latest', type: 'version' });

    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('snapshot type tag', () => {
    const snapshot = createSnapshot({ text: 'Tech Preview', type: 'tag' });
    expect(snapshot.toJSON()).toMatchSnapshot();
  });
});

function getComponent(props: Props) {
  return <TagLabel text={props.text} type={props.type} />;
}
