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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { FACTORY_LINK_ATTR } from '@eclipse-che/common';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { createMemoryHistory, MemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';

import ExpandableWarning from '@/components/ExpandableWarning';
import { MIN_STEP_DURATION_MS, TIMEOUT_TO_RESOLVE_SEC } from '@/components/WorkspaceProgress/const';
import CreatingStepFetchDevfile from '@/components/WorkspaceProgress/CreatingSteps/Fetch/Devfile';
import getComponentRenderer from '@/services/__mocks__/getComponentRenderer';
import devfileApi from '@/services/devfileApi';
import { getDefer } from '@/services/helpers/deferred';
import {
  FACTORY_URL_ATTR,
  OVERRIDE_ATTR_PREFIX,
  REMOTES_ATTR,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { AlertItem } from '@/services/helpers/types';
import { AppThunk } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { OAuthResponse } from '@/store/FactoryResolver';
import { FactoryResolverActionCreators } from '@/store/FactoryResolver';

jest.mock('@/components/WorkspaceProgress/TimeLimit');

const mockRequestFactoryResolver = jest.fn();
jest.mock('@/store/FactoryResolver/actions', () => {
  return {
    ...jest.requireActual('@/store/FactoryResolver'),
    actionCreators: {
      requestFactoryResolver:
        (
          ...args: Parameters<FactoryResolverActionCreators['requestFactoryResolver']>
        ): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> =>
          mockRequestFactoryResolver(...args),
    } as FactoryResolverActionCreators,
  };
});

const mockIsOAuthResponse = jest.fn().mockReturnValue(false);
const mockOpenOAuthPage = jest.fn();
jest.mock('@/services/oauth', () => {
  return {
    __esModule: true,
    OAuthService: {
      openOAuthPage: (..._args: unknown[]) => mockOpenOAuthPage(..._args),
      refreshTokenIfNeeded: () => jest.fn().mockResolvedValue(undefined),
    },
    isOAuthResponse: (..._args: unknown[]) => mockIsOAuthResponse(..._args),
  };
});

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnError = jest.fn();
const mockOnHideError = jest.fn();

const factoryUrl = 'https://factory-url';

describe('Creating steps, fetching a devfile', () => {
  let searchParams: URLSearchParams;
  let store: Store;
  let devfile: devfileApi.Devfile;
  let user: UserEvent;

  beforeEach(() => {
    devfile = {
      schemaVersion: '2.2.2',
      metadata: {
        name: 'my-project',
        namespace: 'user-che',
        generateName: 'my-project-',
      },
    };
    store = new FakeStoreBuilder()
      .withFactoryResolver({
        resolver: {
          devfile,
          location: factoryUrl,
        },
      })
      .build();

    searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });

    jest.useFakeTimers();

    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('factory should not resolve the SSH location', async () => {
    const searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: 'git@github.com:eclipse-che/che-dashboard.git',
    });

    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
    expect(mockRequestFactoryResolver).not.toHaveBeenCalled();
  });

  test('devfile is already resolved', async () => {
    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });

  test('no project url, remotes exist', async () => {
    const store = new FakeStoreBuilder().build();

    const remotesAttr =
      '{{test-1,http://git-test-1.git},{test-2,http://git-test-2.git},{test-3,http://git-test-3.git}}';
    searchParams.append(REMOTES_ATTR, remotesAttr);
    searchParams.delete(FACTORY_URL_ATTR);

    renderComponent(store, searchParams);

    await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockOnRestart).not.toHaveBeenCalled();
  });

  describe('invalid schema error', () => {
    let emptyStore: Store;
    const rejectReason = '... schema validation failed ...';

    beforeEach(() => {
      emptyStore = new FakeStoreBuilder().build();
      mockRequestFactoryResolver.mockRejectedValueOnce(rejectReason);
    });

    test('notification alert', async () => {
      renderComponent(emptyStore, searchParams);
      await jest.runAllTimersAsync();

      const expectAlertItem = expect.objectContaining({
        title: 'Warning',
        children: (
          <ExpandableWarning
            errorMessage={rejectReason}
            textAfter="If you continue it will be ignored and a regular workspace will be created.
            You will have a chance to fix the Devfile from the IDE once it is started."
            textBefore="The Devfile in the git repository is invalid:"
          />
        ),
        actionCallbacks: [
          expect.objectContaining({
            title: 'Continue with default devfile',
            callback: expect.any(Function),
          }),
          expect.objectContaining({
            title: 'Reload',
            callback: expect.any(Function),
          }),
        ],
      });
      await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();
    });

    test('action callback to continue with default devfile"', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      const actionTitle = 'Continue with default devfile';
      mockOnError.mockImplementationOnce((alertItem: AlertItem) => {
        const action = alertItem.actionCallbacks?.find(action =>
          action.title.startsWith(actionTitle),
        );
        expect(action).toBeDefined();

        if (action) {
          deferred.promise.then(action.callback);
        } else {
          throw new Error('Action not found');
        }
      });

      renderComponent(emptyStore, searchParams);
      await jest.runAllTimersAsync();

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      expect(mockOnRestart).not.toHaveBeenCalled();
      expect(mockOnNextStep).not.toHaveBeenCalled();

      mockOnError.mockClear();

      /* test the action */
      await jest.runOnlyPendingTimersAsync();

      // resolve deferred to trigger the callback
      deferred.resolve();

      await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
      expect(mockOnRestart).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    test('action callback to reload the step', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      const reloadActionTitle = 'Reload';
      mockOnError.mockImplementationOnce((alertItem: AlertItem) => {
        const reloadAction = alertItem.actionCallbacks?.find(action =>
          action.title.startsWith(reloadActionTitle),
        );
        expect(reloadAction).toBeDefined();

        if (reloadAction) {
          deferred.promise.then(reloadAction.callback);
        } else {
          throw new Error('Action not found');
        }
      });

      renderComponent(emptyStore, searchParams);
      await jest.runAllTimersAsync();

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      expect(mockOnRestart).not.toHaveBeenCalled();
      expect(mockOnNextStep).not.toHaveBeenCalled();

      // first call resolves with error
      expect(mockRequestFactoryResolver).toHaveBeenCalledTimes(1);

      mockOnError.mockClear();

      /* test the action */
      await jest.runOnlyPendingTimersAsync();

      // resolve deferred to trigger the callback
      deferred.resolve();

      await waitFor(() => expect(mockOnRestart).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();

      // should request the factory resolver for the second time
      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalledTimes(2));
    });
  });

  describe('step timeout reached', () => {
    let emptyStore: Store;

    beforeEach(() => {
      emptyStore = new FakeStoreBuilder().build();
    });

    test('notification alert', async () => {
      renderComponent(emptyStore, searchParams);
      jest.runAllTimers();

      // trigger timeout
      const timeoutButton = screen.getByRole('button', {
        name: 'onTimeout',
      });
      await user.click(timeoutButton);

      const expectAlertItem = expect.objectContaining({
        title: 'Failed to create the workspace',
        children: `Devfile hasn't been resolved in the last ${TIMEOUT_TO_RESOLVE_SEC} seconds.`,
        actionCallbacks: [
          expect.objectContaining({
            title: 'Continue with default devfile',
            callback: expect.any(Function),
          }),
          expect.objectContaining({
            title: 'Click to try again',
            callback: expect.any(Function),
          }),
        ],
      });
      await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnRestart).not.toHaveBeenCalled();
    });

    test('action callback to try again', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      const actionTitle = 'Click to try again';
      mockOnError.mockImplementationOnce((alertItem: AlertItem) => {
        const action = alertItem.actionCallbacks?.find(action =>
          action.title.startsWith(actionTitle),
        );
        expect(action).toBeDefined();

        if (action) {
          deferred.promise.then(action.callback);
        } else {
          throw new Error('Action not found');
        }
      });

      renderComponent(emptyStore, searchParams);
      await jest.runAllTimersAsync();

      // trigger timeout
      const timeoutButton = screen.getByRole('button', {
        name: 'onTimeout',
      });
      await user.click(timeoutButton);

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      mockOnError.mockClear();
      expect(mockOnRestart).not.toHaveBeenCalled();
      expect(mockOnNextStep).not.toHaveBeenCalled();

      /* test the action */

      // resolve deferred to trigger the callback
      deferred.resolve();
      await jest.runOnlyPendingTimersAsync();

      await waitFor(() => expect(mockOnRestart).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('unsupported git provider error', () => {
    let emptyStore: Store;
    const rejectReason = 'Failed to fetch devfile';

    beforeEach(() => {
      emptyStore = new FakeStoreBuilder().build();
      mockRequestFactoryResolver.mockRejectedValueOnce(rejectReason);
    });

    test('alert title', async () => {
      renderComponent(emptyStore, searchParams);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      const expectAlertItem = expect.objectContaining({
        title: 'Warning',
        actionCallbacks: [
          expect.objectContaining({
            title: 'Continue with default devfile',
            callback: expect.any(Function),
          }),
          expect.objectContaining({
            title: 'Reload',
            callback: expect.any(Function),
          }),
        ],
      });
      await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

      expect(mockOnNextStep).not.toHaveBeenCalled();
    });

    test('action "Continue with default devfile"', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      const actionTitle = 'Continue with default devfile';
      mockOnError.mockImplementationOnce((alertItem: AlertItem) => {
        const action = alertItem.actionCallbacks?.find(_action =>
          _action.title.startsWith(actionTitle),
        );
        expect(action).toBeDefined();

        if (action) {
          deferred.promise.then(action.callback);
        } else {
          throw new Error('Action not found');
        }
      });

      renderComponent(emptyStore, searchParams);
      await jest.runAllTimersAsync();

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      expect(mockOnRestart).not.toHaveBeenCalled();
      expect(mockOnNextStep).not.toHaveBeenCalled();

      mockOnError.mockClear();

      /* test the action */
      await jest.runOnlyPendingTimersAsync();

      // resolve deferred to trigger the callback
      deferred.resolve();

      await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
      expect(mockOnRestart).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    test('action "Reload"', async () => {
      // this deferred object will help run the callback at the right time
      const deferred = getDefer();

      const actionTitle = 'Reload';
      mockOnError.mockImplementationOnce(async (alertItem: AlertItem) => {
        const action = alertItem.actionCallbacks?.find(_action =>
          _action.title.startsWith(actionTitle),
        );
        expect(action).toBeDefined();

        if (action) {
          deferred.promise.then(action.callback);
        } else {
          throw new Error('Action not found');
        }
      });

      renderComponent(emptyStore, searchParams);
      await jest.runAllTimersAsync();

      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      expect(mockOnRestart).not.toHaveBeenCalled();
      expect(mockOnNextStep).not.toHaveBeenCalled();

      // first call resolves with error
      expect(mockRequestFactoryResolver).toHaveBeenCalledTimes(1);

      mockOnError.mockClear();

      /* test the action */

      await jest.runAllTimersAsync();

      // resolve deferred to trigger the callback
      deferred.resolve();

      await waitFor(() => expect(mockOnRestart).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();

      // should request the factory resolver for the second time
      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalledTimes(2));
    });
  });

  describe('public repo', () => {
    beforeEach(() => {
      mockRequestFactoryResolver.mockResolvedValueOnce(undefined);
    });

    test('request factory resolver', async () => {
      const emptyStore = new FakeStoreBuilder().build();
      renderComponent(emptyStore, searchParams);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalled());
    });

    test('request factory resolver with override attributes', async () => {
      const attrName = `${OVERRIDE_ATTR_PREFIX}metadata.generateName`;
      const attrValue = 'testPrefix';
      const expectedOverrideParams = { [attrName]: attrValue };
      // add override param
      searchParams.append(attrName, attrValue);
      const emptyStore = new FakeStoreBuilder().build();

      renderComponent(emptyStore, searchParams);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(mockRequestFactoryResolver).toHaveBeenCalledWith(
          factoryUrl,
          expect.objectContaining({
            overrides: expectedOverrideParams,
          }),
        ),
      );
    });

    test('devfile resolved successfully', async () => {
      const emptyStore = new FakeStoreBuilder().build();

      const { reRenderComponent } = renderComponent(emptyStore, searchParams);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalled());
      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockOnNextStep).not.toHaveBeenCalled();

      // wait a bit less than the devfile resolving timeout
      const time = (TIMEOUT_TO_RESOLVE_SEC - 1) * 1000;
      await jest.advanceTimersByTimeAsync(time);

      // build next store
      const nextStore = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            location: factoryUrl,
            devfile: {
              schemaVersion: '2.2.2',
              metadata: {
                name: 'my-project',
                namespace: 'user-che',
              },
            },
          },
        })
        .build();
      reRenderComponent(nextStore, searchParams);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('private repo', () => {
    const oauthAuthenticationUrl = 'https://oauth_authentication_url';
    const host = 'che-host';
    const protocol = 'http://';
    let spyWindowLocation: jest.SpyInstance;
    let history: MemoryHistory;

    beforeEach(() => {
      mockIsOAuthResponse.mockReturnValue(true);
      mockRequestFactoryResolver.mockRejectedValue({
        attributes: {
          oauth_provider: 'oauth_provider',
          oauth_authentication_url: oauthAuthenticationUrl,
        },
      } as OAuthResponse);

      spyWindowLocation = createWindowLocationSpy(host, protocol);

      history = createMemoryHistory({
        initialEntries: [
          {
            search: searchParams.toString(),
          },
        ],
      });
    });

    afterEach(() => {
      sessionStorage.clear();
      spyWindowLocation.mockClear();
    });

    test('redirect to an authentication URL', async () => {
      const emptyStore = new FakeStoreBuilder().build();

      renderComponent(emptyStore, searchParams, history);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      const expectedRedirectUrl = `${protocol}${host}/f?${FACTORY_LINK_ATTR}=${encodeURIComponent(
        btoa('url=' + encodeURIComponent(factoryUrl)),
      )}`;

      await waitFor(() =>
        expect(mockOpenOAuthPage).toHaveBeenCalledWith(oauthAuthenticationUrl, expectedRedirectUrl),
      );

      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockOnNextStep).not.toHaveBeenCalled();
    });

    test('authentication fails', async () => {
      const emptyStore = new FakeStoreBuilder().build();

      renderComponent(emptyStore, searchParams, history);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      const expectedRedirectUrl = `${protocol}${host}/f?${FACTORY_LINK_ATTR}=${encodeURIComponent(
        btoa('url=' + encodeURIComponent(factoryUrl)),
      )}`;

      await waitFor(() =>
        expect(mockOpenOAuthPage).toHaveBeenCalledWith(oauthAuthenticationUrl, expectedRedirectUrl),
      );

      // cleanup previous render
      cleanup();

      // first unsuccessful try to resolve devfile after authentication
      renderComponent(emptyStore, searchParams, history);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(mockOpenOAuthPage).toHaveBeenCalledWith(oauthAuthenticationUrl, expectedRedirectUrl),
      );

      await waitFor(() => expect(mockOnError).not.toHaveBeenCalled());

      // cleanup previous render
      cleanup();

      // second unsuccessful try to resolve devfile after authentication
      renderComponent(emptyStore, searchParams, history);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(mockOpenOAuthPage).toHaveBeenCalledWith(oauthAuthenticationUrl, expectedRedirectUrl),
      );

      const expectAlertItem = expect.objectContaining({
        title: 'Failed to create the workspace',
        children:
          'The Dashboard reached a limit of reloads while trying to resolve a devfile in a private repo. Please contact admin to check if OAuth is configured correctly.',
        actionCallbacks: [
          expect.objectContaining({
            title: 'Continue with default devfile',
            callback: expect.any(Function),
          }),
          expect.objectContaining({
            title: 'Click to try again',
            callback: expect.any(Function),
          }),
        ],
      });
      await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(expectAlertItem));

      expect(mockOnNextStep).not.toHaveBeenCalled();
    });

    test('authentication passes', async () => {
      const emptyStore = new FakeStoreBuilder().build();

      renderComponent(emptyStore, searchParams);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalled());

      // cleanup previous render
      cleanup();

      // the devfile should be resolved now
      mockRequestFactoryResolver.mockResolvedValueOnce(undefined);

      // redirect after authentication
      const { reRenderComponent } = renderComponent(emptyStore, searchParams);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalled());

      // build next store
      const nextStore = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            location: factoryUrl,
            devfile: {
              metadata: {
                name: 'my-project',
                generateName: 'my-project-',
              },
            } as devfileApi.Devfile,
          },
        })
        .build();
      reRenderComponent(nextStore, searchParams);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('private git+SSH URL repo', () => {
    const host = 'che-host';
    const protocol = 'http://';
    const factoryUrl = 'git@github.com:user/repository-name.git';

    let spyWindowLocation: jest.SpyInstance;
    let history: MemoryHistory;

    beforeEach(() => {
      store = new FakeStoreBuilder().build();

      searchParams = new URLSearchParams({
        [FACTORY_URL_ATTR]: factoryUrl,
      });

      mockRequestFactoryResolver.mockRejectedValue('Could not reach devfile');

      spyWindowLocation = createWindowLocationSpy(host, protocol);

      history = createMemoryHistory({
        initialEntries: [
          {
            search: searchParams.toString(),
          },
        ],
      });
    });

    afterEach(() => {
      sessionStorage.clear();
      spyWindowLocation.mockClear();
    });

    it('should go to next step', async () => {
      const emptyStore = new FakeStoreBuilder().build();

      renderComponent(emptyStore, searchParams, history);

      await jest.advanceTimersByTimeAsync(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());

      expect(mockOpenOAuthPage).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });
});

function createWindowLocationSpy(host: string, protocol: string): jest.SpyInstance {
  delete (window as any).location;
  (window.location as any) = {
    host,
    protocol,
    origin: protocol + host,
  };
  Object.defineProperty(window.location, 'href', {
    set: () => {
      // no-op
    },
    configurable: true,
  });
  return jest.spyOn(window.location, 'href', 'set');
}

function getComponent(
  store: Store,
  searchParams: URLSearchParams,
  history = createMemoryHistory(),
): React.ReactElement {
  return (
    <Provider store={store}>
      <CreatingStepFetchDevfile
        distance={0}
        hasChildren={false}
        history={history}
        searchParams={searchParams}
        onNextStep={mockOnNextStep}
        onRestart={mockOnRestart}
        onError={mockOnError}
        onHideError={mockOnHideError}
      />
    </Provider>
  );
}
