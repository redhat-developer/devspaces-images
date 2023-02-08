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

import React, { Suspense } from 'react';
import { Location } from 'history';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import Routes from '..';
import { FakeStoreBuilder } from '../../store/__mocks__/storeBuilder';
import Fallback from '../../components/Fallback';
import { ROUTE } from '../routes';
import {
  buildDetailsLocation,
  buildGettingStartedLocation,
  buildIdeLoaderLocation,
  buildWorkspacesLocation,
} from '../../services/helpers/location';
import { LoaderTab, WorkspaceDetailsTab } from '../../services/helpers/types';
import { constructWorkspace, Workspace } from '../../services/workspace-adapter';
import { DevWorkspaceBuilder } from '../../store/__mocks__/devWorkspaceBuilder';

jest.mock('../../pages/GetStarted', () => {
  return function GetStarted() {
    return <span>Quick Add</span>;
  };
});
jest.mock('../../containers/WorkspacesList.tsx', () => {
  return function WorkspacesList() {
    return <span>Workspaces List</span>;
  };
});
jest.mock('../../containers/WorkspaceDetails', () => {
  return function WorkspaceDetails() {
    return <span>Workspace Details</span>;
  };
});
jest.mock('../../containers/Loader', () => {
  return function Loader() {
    return <span>Loader</span>;
  };
});
jest.mock('../../pages/UserPreferences', () => {
  return function UserPreferences() {
    return <span>User Preferences</span>;
  };
});

describe('Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Quick Add route', () => {
    it('should handle "/"', async () => {
      const path = ROUTE.HOME;
      render(getComponent(path));

      await waitFor(() => expect(screen.queryByText('Quick Add')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/quick-add"', async () => {
      const location = buildGettingStartedLocation();
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Quick Add')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/create-workspace?tab=quick-add"', async () => {
      const location = buildGettingStartedLocation('quick-add');
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Quick Add')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Workspaces List route', () => {
    it('should handle "/workspaces"', async () => {
      const location = buildWorkspacesLocation();
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspaces List')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Workspace Details route', () => {
    let workspace: Workspace;

    beforeEach(() => {
      workspace = constructWorkspace(
        new DevWorkspaceBuilder().withNamespace('namespace').withName('wksp').build(),
      );
    });

    it('should handle "/workspace/namespace/name"', async () => {
      const location = buildDetailsLocation(workspace);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspace Details')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/workspace/namespace/name?tab=Overview"', async () => {
      const location = buildDetailsLocation(workspace, WorkspaceDetailsTab.OVERVIEW);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspace Details')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/workspace/namespace/name?tab=Devfile"', async () => {
      const location = buildDetailsLocation(workspace, WorkspaceDetailsTab.DEVFILE);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspace Details')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/workspace/namespace/name?tab=Devworkspace"', async () => {
      const location = buildDetailsLocation(workspace, WorkspaceDetailsTab.DEVWORKSPACE);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspace Details')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });
  });

  describe('IDE Loader route', () => {
    let workspace: Workspace;

    beforeEach(() => {
      workspace = constructWorkspace(
        new DevWorkspaceBuilder().withNamespace('namespace').withName('wksp').build(),
      );
    });

    it('should handle "/ide/namespace/name"', async () => {
      const location = buildIdeLoaderLocation(workspace);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Loader')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/ide/namespace/name?tab=Progress"', async () => {
      const path = buildIdeLoaderLocation(workspace, LoaderTab.Progress);
      render(getComponent(path));

      await waitFor(() => expect(screen.queryByText('Loader')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/ide/namespace/name?tab=Logs"', async () => {
      const location = buildIdeLoaderLocation(workspace, LoaderTab.Logs);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Loader')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });
  });

  describe('User Preferences route', () => {
    it('should handle "/user-preferences"', async () => {
      const path = ROUTE.USER_PREFERENCES;
      render(getComponent(path));

      await waitFor(() => expect(screen.queryByText('User Preferences')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });
  });
});

function getComponent(locationOrPath: Location | string): React.ReactElement {
  const store = new FakeStoreBuilder().build();
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[locationOrPath]}>
        <Suspense fallback={Fallback}>
          <Routes />
        </Suspense>
      </MemoryRouter>
    </Provider>
  );
}
