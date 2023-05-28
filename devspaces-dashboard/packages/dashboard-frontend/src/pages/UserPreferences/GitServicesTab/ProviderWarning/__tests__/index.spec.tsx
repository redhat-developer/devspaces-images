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

import React from 'react';
import renderer from 'react-test-renderer';
import ProviderWarning from '..';

jest.mock('@patternfly/react-core', () => {
  return {
    Tooltip: (props: any) => {
      return (
        <>
          {props.children}
          {props.content}
        </>
      );
    },
    TooltipPosition: {
      right: 'right',
    },
  };
});

describe('ProviderWarning component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render ProviderWarning correctly', () => {
    const element = (
      <ProviderWarning
        warning={
          <>
            Provided API does not support the automatic token revocation. You can revoke it manually
            on <a href="http://dummy.ref">link</a>.
          </>
        }
      />
    );

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });
});
