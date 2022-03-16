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
import { Provider } from 'react-redux';
import { render, waitFor } from '@testing-library/react';
import { ROUTE } from '../../../route.enum';
import { getMockRouterProps } from '../../../services/__mocks__/router';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import FactoryLoaderContainer, { LoadFactorySteps } from '..';
import { AlertOptions } from '../../../pages/IdeLoader';
import { constructWorkspace, Devfile } from '../../../services/workspace-adapter';
import { actionCreators as workspacesActionCreators } from '../../../store/Workspaces';
import {
  actionCreators as factoryResolverActionCreators,
  isOAuthResponse,
} from '../../../store/FactoryResolver';
import SessionStorageService, { SessionStorageKey } from '../../../services/session-storage';
import { RouterProps } from 'react-router';
import { Store } from 'redux';

const showAlertMock = jest.fn();
const setWorkspaceQualifiedName = jest.fn();
const createWorkspaceFromDevfileMock = jest.fn().mockResolvedValue(undefined);
const requestWorkspaceMock = jest.fn().mockResolvedValue(undefined);
const startWorkspaceMock = jest.fn().mockResolvedValue(undefined);
const requestFactoryResolverMock = jest.fn().mockResolvedValue(undefined);
const setWorkspaceIdMock = jest.fn().mockResolvedValue(undefined);
const clearWorkspaceIdMock = jest.fn().mockResolvedValue(undefined);

const createWorkspaceFromResourcesMock = jest.fn().mockReturnValue(undefined);
jest.mock('../../../store/Workspaces/devWorkspaces/index', () => {
  return {
    actionCreators: {
      createWorkspaceFromResources:
        (devworkspace: string, devworkspaceTemplate: string) => async (): Promise<void> => {
          createWorkspaceFromResourcesMock(devworkspace, devworkspaceTemplate);
        },
    },
  };
});

jest.mock('../../../store/Workspaces');
(workspacesActionCreators.requestWorkspace as jest.Mock).mockImplementation(
  (id: string) => async () => requestWorkspaceMock(id),
);
(workspacesActionCreators.startWorkspace as jest.Mock).mockImplementation(
  (workspace: string) => async () => startWorkspaceMock(workspace),
);
(workspacesActionCreators.createWorkspaceFromDevfile as jest.Mock).mockImplementation(
  (
      devfile: Devfile,
      namespace: string,
      infrastructureNamespace: string,
      attributes: { [key: string]: string },
    ) =>
    async () => {
      createWorkspaceFromDevfileMock(devfile, namespace, infrastructureNamespace, attributes);
      return constructWorkspace({
        id: 'id-wksp-test',
        attributes: attributes as che.WorkspaceAttributes,
        namespace,
        devfile: devfile as che.WorkspaceDevfile,
        temporary: false,
        status: 'STOPPED',
      });
    },
);
(workspacesActionCreators.setWorkspaceId as jest.Mock).mockImplementation(
  (id: string) => async () => setWorkspaceIdMock(id),
);
(workspacesActionCreators.clearWorkspaceId as jest.Mock).mockImplementation(
  () => async () => clearWorkspaceIdMock(),
);
(workspacesActionCreators.setWorkspaceQualifiedName as jest.Mock).mockImplementation(
  (namespace: string, workspaceName: string) => async () =>
    setWorkspaceQualifiedName(namespace, workspaceName),
);

jest.mock('../../../store/FactoryResolver');
const actualModule = jest.requireActual('../../../store/FactoryResolver');
(isOAuthResponse as unknown as jest.Mock).mockImplementation(actualModule.isOAuthResponse);
(factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
  (
      location: string,
      overrideParams?: {
        [params: string]: string;
      },
    ) =>
    async () => {
      if (!overrideParams) {
        requestFactoryResolverMock(location);
      } else {
        requestFactoryResolverMock(location, overrideParams);
      }
    },
);

jest.mock('../../../pages/FactoryLoader', () => {
  return function DummyWizard(props: {
    hasError: boolean;
    currentStep: LoadFactorySteps;
    workspaceName: string;
    workspaceId: string;
    resolvedDevfileMessage?: string;
    callbacks?: {
      showAlert?: (alertOptions: AlertOptions) => void;
    };
  }): React.ReactElement {
    if (props.callbacks) {
      props.callbacks.showAlert = showAlertMock;
    }
    return (
      <div>
        Dummy Wizard
        <div data-testid="factory-loader-has-error">{props.hasError.toString()}</div>
        <div data-testid="factory-loader-current-step">{props.currentStep}</div>
        <div data-testid="factory-loader-workspace-name">{props.workspaceName}</div>
        <div data-testid="factory-loader-workspace-id">{props.workspaceId}</div>
        <div data-testid="factory-loader-devfile-location-info">{props.resolvedDevfileMessage}</div>
      </div>
    );
  };
});

describe('Factory Loader container', () => {
  const privateRepoUrl = 'https://my-private.repo';
  const oauthAuthenticationUrl = 'https://oauth_authentication_url';
  const host = 'che-host';
  const protocol = 'http://';

  let spyWindowLocation: jest.SpyInstance;

  beforeEach(() => {
    (factoryResolverActionCreators.requestFactoryResolver as jest.Mock).mockImplementation(
      () => async () => {
        throw {
          attributes: {
            oauth_provider: 'oauth_provider',
            oauth_authentication_url: oauthAuthenticationUrl,
          },
        };
      },
    );
    spyWindowLocation = createWindowLocationSpy(host, protocol);
  });

  afterEach(() => {
    sessionStorage.clear();
    spyWindowLocation.mockRestore();
    jest.clearAllMocks();
  });

  describe('Resolving a private repository devfile', () => {
    it('should handle the the namespace absence', async () => {
      const store = new FakeStoreBuilder().build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: privateRepoUrl });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      await waitFor(() =>
        expect(showAlertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringMatching('The infrastructure namespace is required to be created.'),
          }),
        ),
      );
    });

    it('should redirect to login page', async () => {
      const store = new FakeStoreBuilder()
        .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
        .build();
      const props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: privateRepoUrl });

      render(
        <Provider store={store}>
          <FactoryLoaderContainer {...props} />
        </Provider>,
      );

      const expectedRedirectUrl = `${oauthAuthenticationUrl}/&redirect_after_login=${protocol}${host}/f?url=${encodeURIComponent(
        privateRepoUrl,
      )}`;

      await waitFor(() => expect(spyWindowLocation).toHaveBeenCalledWith(expectedRedirectUrl));
    });

    describe('prevent reloading loop', () => {
      let store: Store;
      let props: RouterProps;

      beforeEach(() => {
        store = new FakeStoreBuilder()
          .withInfrastructureNamespace([{ name: 'user-che', attributes: { phase: 'Active' } }])
          .build();
        props = getMockRouterProps(ROUTE.LOAD_FACTORY_URL, { url: privateRepoUrl });
      });

      test('page reloads number is less than the limit', async () => {
        const spyStorageGet = jest.spyOn(SessionStorageService, 'get');
        const spyStorageUpdate = jest.spyOn(SessionStorageService, 'update');

        render(
          <Provider store={store}>
            <FactoryLoaderContainer {...props} />
          </Provider>,
        );

        const expectedRedirectUrl = `${oauthAuthenticationUrl}/&redirect_after_login=${protocol}${host}/f?url=${encodeURIComponent(
          privateRepoUrl,
        )}`;

        await waitFor(() => expect(spyWindowLocation).toHaveBeenCalledWith(expectedRedirectUrl));

        expect(spyStorageGet).toHaveBeenCalled();

        expect(spyStorageUpdate).toHaveBeenCalledTimes(1);
        expect(spyStorageUpdate).toHaveBeenCalledWith(
          SessionStorageKey.PRIVATE_FACTORY_RELOADS,
          expect.stringContaining(privateRepoUrl),
        );
        expect(spyStorageUpdate).toHaveBeenCalledWith(
          SessionStorageKey.PRIVATE_FACTORY_RELOADS,
          expect.stringContaining('1'),
        );
      });

      test('page reloads number equals the limit', async () => {
        const spyStorageGet = jest
          .spyOn(SessionStorageService, 'get')
          .mockImplementationOnce(() => {
            return JSON.stringify({
              [privateRepoUrl]: 2,
            });
          });
        const spyStorageUpdate = jest.spyOn(SessionStorageService, 'update');

        render(
          <Provider store={store}>
            <FactoryLoaderContainer {...props} />
          </Provider>,
        );

        await waitFor(() => expect(showAlertMock).toHaveBeenCalled());

        expect(spyWindowLocation).not.toHaveBeenCalledWith();

        expect(spyStorageGet).toHaveBeenCalled();
        expect(spyStorageUpdate).not.toHaveBeenCalled();
      });

      test('page reloads number is more than the limit', async () => {
        const spyStorageGet = jest
          .spyOn(SessionStorageService, 'get')
          .mockImplementationOnce(() => {
            return JSON.stringify({
              [privateRepoUrl]: 2,
            });
          });
        const spyStorageUpdate = jest.spyOn(SessionStorageService, 'update');

        render(
          <Provider store={store}>
            <FactoryLoaderContainer {...props} />
          </Provider>,
        );

        await waitFor(() => expect(showAlertMock).toHaveBeenCalled());

        expect(spyWindowLocation).not.toHaveBeenCalledWith();

        expect(spyStorageGet).toHaveBeenCalled();
        expect(spyStorageUpdate).not.toHaveBeenCalled();
      });
    });
  });
});

function createWindowLocationSpy(host: string, protocol: string): jest.SpyInstance {
  delete (window as any).location;
  (window.location as any) = {
    host,
    protocol,
  };
  Object.defineProperty(window.location, 'href', {
    set: () => {
      // no-op
    },
    configurable: true,
  });
  return jest.spyOn(window.location, 'href', 'set');
}
