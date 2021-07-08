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

import React from 'react';
import renderer from 'react-test-renderer';
import WorkspaceStatusLabel from '..';
import { WorkspaceStatus } from '../../../services/helpers/types';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return (<div>Dummy Tooltip</div>);
  };
});

describe('The workspace status label component', () => {

  it('should render default status correctly', () => {
    const element = (<WorkspaceStatusLabel
      status={undefined}
    />);

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  it('should render STOPPED status correctly', () => {
    const element = (<WorkspaceStatusLabel
      status={WorkspaceStatus.STOPPED}
    />);

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  it('should render RUNNING status correctly', () => {
    const element = (<WorkspaceStatusLabel
      status={WorkspaceStatus.RUNNING}
    />);

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  it('should render ERROR status correctly', () => {
    const element = (<WorkspaceStatusLabel
      status={WorkspaceStatus.ERROR}
    />);

    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });
});
