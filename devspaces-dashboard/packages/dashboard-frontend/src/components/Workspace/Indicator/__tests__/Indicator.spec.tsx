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
import renderer, { ReactTestRendererJSON } from 'react-test-renderer';
import WorkspaceIndicator from '..';
import { DevWorkspaceStatus, WorkspaceStatus } from '../../../../services/helpers/types';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});

describe('Workspace indicator component', () => {
  it('should render default status correctly', () => {
    const element = <WorkspaceIndicator status={WorkspaceStatus.STOPPING} />;
    expect(renderer.create(element).toJSON()).toMatchSnapshot();
  });

  describe('Che Workspaces', () => {
    it('should render STOPPED status correctly', () => {
      const element = <WorkspaceIndicator status={WorkspaceStatus.STOPPED} />;
      expect(getComponentSnapshot(element)).toMatchSnapshot();
    });

    it('should render STARTING status correctly', () => {
      const element = <WorkspaceIndicator status={WorkspaceStatus.STARTING} />;
      expect(getComponentSnapshot(element)).toMatchSnapshot();
    });

    it('should render RUNNING status correctly', () => {
      const element = <WorkspaceIndicator status={WorkspaceStatus.RUNNING} />;
      expect(getComponentSnapshot(element)).toMatchSnapshot();
    });

    it('should render ERROR status correctly', () => {
      const element = <WorkspaceIndicator status={WorkspaceStatus.ERROR} />;
      expect(getComponentSnapshot(element)).toMatchSnapshot();
    });

    it('should render STOPPING status correctly', () => {
      const element = <WorkspaceIndicator status={WorkspaceStatus.STOPPING} />;
      expect(getComponentSnapshot(element)).toMatchSnapshot();
    });
  });

  describe('DevWorkspaces', () => {
    it('should render STOPPED status correctly', () => {
      const element = <WorkspaceIndicator status={DevWorkspaceStatus.STOPPED} />;
      expect(getComponentSnapshot(element)).toMatchSnapshot();
    });

    it('should render RUNNING status correctly', () => {
      const element = <WorkspaceIndicator status={DevWorkspaceStatus.RUNNING} />;
      expect(getComponentSnapshot(element)).toMatchSnapshot();
    });

    it('should render FAILED status correctly', () => {
      const element = <WorkspaceIndicator status={DevWorkspaceStatus.FAILED} />;
      expect(getComponentSnapshot(element)).toMatchSnapshot();
    });

    it('should render FAILING status correctly', () => {
      const element = <WorkspaceIndicator status={DevWorkspaceStatus.FAILING} />;
      expect(getComponentSnapshot(element)).toMatchSnapshot();
    });
  });

  describe('Deprecated workspaces', () => {
    it('should render "Deprecated" status correctly', () => {
      const element = <WorkspaceIndicator status={'Deprecated'} />;
      expect(getComponentSnapshot(element)).toMatchSnapshot();
    });
  });
});

function getComponentSnapshot(
  component: React.ReactElement,
): null | ReactTestRendererJSON | ReactTestRendererJSON[] {
  return renderer.create(component).toJSON();
}
