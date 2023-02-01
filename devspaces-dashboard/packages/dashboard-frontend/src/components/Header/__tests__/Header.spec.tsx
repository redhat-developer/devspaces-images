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
import Header from '..';
import { WorkspaceStatus } from '../../../services/helpers/types';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});

describe('The header component for IDE-loader and Factory-loader pages', () => {
  it('should render start workspace correctly', () => {
    const element = <Header title="Start workspace" status={WorkspaceStatus.STARTING} />;

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  it('should render workspace error correctly', () => {
    const element = <Header title="Workspace error" status={WorkspaceStatus.ERROR} />;

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });
});
