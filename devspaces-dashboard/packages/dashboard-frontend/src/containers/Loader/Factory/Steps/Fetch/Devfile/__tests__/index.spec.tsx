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

import { StateMock } from '@react-mock/state';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';
import StepFetchDevfile, { State, UnsupportedGitProviderError } from '..';
import { List, LoaderStep, LoadingStep } from '../../../../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getFactoryLoadingSteps,
} from '../../../../../../../components/Loader/Step/buildSteps';
import devfileApi from '../../../../../../../services/devfileApi';
import getComponentRenderer from '../../../../../../../services/__mocks__/getComponentRenderer';
import { AppThunk } from '../../../../../../../store';
import { ActionCreators, OAuthResponse } from '../../../../../../../store/FactoryResolver';
import { FakeStoreBuilder } from '../../../../../../../store/__mocks__/storeBuilder';
import { buildFactoryParams } from '../../../../../buildFactoryParams';
import {
  FACTORY_URL_ATTR,
  MIN_STEP_DURATION_MS,
  OVERRIDE_ATTR_PREFIX,
  REMOTES_ATTR,
  TIMEOUT_TO_RESOLVE_SEC,
} from '../../../../../const';

jest.mock('../../../../../../../pages/Loader');

const mockRequestFactoryResolver = jest.fn();
const mockIsOAuthResponse = jest.fn();
jest.mock('../../../../../../../store/FactoryResolver', () => {
  return {
    actionCreators: {
      requestFactoryResolver:
        (
          ...args: Parameters<ActionCreators['requestFactoryResolver']>
        ): AppThunk<Action, Promise<void>> =>
        async (): Promise<void> =>
          mockRequestFactoryResolver(...args),
    } as ActionCreators,
    isOAuthResponse: (_args: unknown[]) => mockIsOAuthResponse(_args),
  };
});

const { renderComponent } = getComponentRenderer(getComponent);

const mockOnNextStep = jest.fn();
const mockOnRestart = jest.fn();
const mockOnTabChange = jest.fn();

const stepId = LoadingStep.CREATE_WORKSPACE__FETCH_DEVFILE.toString();
const currentStepIndex = 3;
const loadingSteps = getFactoryLoadingSteps('devfile');

const factoryUrl = 'https://factory-url';

describe('Factory Loader container, step CREATE_WORKSPACE__FETCH_DEVFILE', () => {
  let searchParams: URLSearchParams;
  let store: Store;
  let loaderSteps: List<LoaderStep>;

  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withFactoryResolver({
        resolver: {
          devfile: {} as devfileApi.Devfile,
          location: factoryUrl,
        },
        converted: {
          devfileV2: {} as devfileApi.Devfile,
        },
      })
      .build();

    searchParams = new URLSearchParams({
      [FACTORY_URL_ATTR]: factoryUrl,
    });

    loaderSteps = buildLoaderSteps(loadingSteps);

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test('devfile is already resolved', async () => {
    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const currentStepId = screen.getByTestId('current-step-id');
    await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

    const currentStep = screen.getByTestId(stepId);
    const hasError = within(currentStep).getByTestId('hasError');
    expect(hasError.textContent).toEqual('false');

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());

    expect(mockRequestFactoryResolver).not.toHaveBeenCalled();
  });

  test('restart flow', async () => {
    const localState: Partial<State> = {
      lastError: new Error('Unexpected error'),
      factoryParams: buildFactoryParams(searchParams),
    };
    renderComponent(store, loaderSteps, searchParams, currentStepIndex, localState);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const restartButton = await screen.findByRole('button', {
      name: 'Click to try again',
    });
    expect(restartButton).toBeDefined();
    userEvent.click(restartButton);

    expect(mockOnRestart).toHaveBeenCalled();
  });

  test('unsupported git provider', async () => {
    const localState: Partial<State> = {
      lastError: new UnsupportedGitProviderError('Failed to fetch devfile'),
      factoryParams: buildFactoryParams(searchParams),
    };
    renderComponent(store, loaderSteps, searchParams, currentStepIndex, localState);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    const defaultDevfileButton = await screen.findByRole('button', {
      name: 'Continue with the default devfile',
    });
    expect(defaultDevfileButton).toBeDefined();
    userEvent.click(defaultDevfileButton);

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
  });

  test('no project url, remotes exist', async () => {
    const store = new FakeStoreBuilder().build();

    const remotesAttr =
      '{{test-1,http://git-test-1.git},{test-2,http://git-test-2.git},{test-3,http://git-test-3.git}}';
    searchParams.append(REMOTES_ATTR, remotesAttr);
    searchParams.delete(FACTORY_URL_ATTR);

    renderComponent(store, loaderSteps, searchParams);

    jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

    await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
  });

  describe('step title', () => {
    test('direct link to devfile', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile: {} as devfileApi.Devfile,
            location: factoryUrl,
            source: undefined, // <-
          },
          converted: {
            isConverted: false,
            devfileV2: {} as devfileApi.Devfile,
          },
        })
        .build();

      renderComponent(store, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const currentStep = screen.getByTestId(stepId);
      const title = within(currentStep).getByTestId('title');
      await waitFor(() => expect(title.textContent).toEqual(`Devfile loaded from ${factoryUrl}.`));
    });

    test('devfile not found', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile: {} as devfileApi.Devfile,
            location: factoryUrl,
            source: 'repo', // <-
          },
          converted: {
            isConverted: false,
            devfileV2: {} as devfileApi.Devfile,
          },
        })
        .build();

      renderComponent(store, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const currentStep = screen.getByTestId(stepId);
      const title = within(currentStep).getByTestId('title');
      await waitFor(() =>
        expect(title.textContent).toEqual(
          `Devfile could not be found in ${factoryUrl}. Applying the default configuration.`,
        ),
      );
    });

    test('devfile found', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile: {} as devfileApi.Devfile,
            location: factoryUrl,
            source: 'devfile.yaml', // <-
          },
          converted: {
            isConverted: false,
            devfileV2: {} as devfileApi.Devfile,
          },
        })
        .build();

      renderComponent(store, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const currentStep = screen.getByTestId(stepId);
      const title = within(currentStep).getByTestId('title');
      await waitFor(() =>
        expect(title.textContent).toEqual(`Devfile found in repo ${factoryUrl} as 'devfile.yaml'.`),
      );
    });

    test('devfile converted', async () => {
      const store = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            devfile: {} as devfileApi.Devfile,
            location: factoryUrl,
            source: 'devfile.yaml',
          },
          converted: {
            isConverted: true, // <-
            devfileV2: {
              schemaVersion: '2.1.0',
            } as devfileApi.Devfile,
          },
        })
        .build();

      renderComponent(store, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const currentStep = screen.getByTestId(stepId);
      const title = within(currentStep).getByTestId('title');
      await waitFor(() =>
        expect(title.textContent).toEqual(
          `Devfile found in repo ${factoryUrl} as 'devfile.yaml'. Devfile version 1 found, converting it to devfile version 2.`,
        ),
      );
    });
  });

  describe('public devfile', () => {
    beforeEach(() => {
      mockRequestFactoryResolver.mockResolvedValue(undefined);
      mockIsOAuthResponse.mockReturnValue(false);
    });

    test('request factory resolver', async () => {
      const emptyStore = new FakeStoreBuilder().build();
      // const path = generatePath(ROUTE.FACTORY_LOADER_URL, { url: factoryUrl });
      renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalled());
    });

    test('request factory resolver with override attributes', async () => {
      const attrName = `${OVERRIDE_ATTR_PREFIX}metadata.generateName`;
      const attrValue = 'testPrefix';
      const expectedOverrideParams = { [attrName]: attrValue };
      // add override param
      searchParams.append(attrName, attrValue);
      const emptyStore = new FakeStoreBuilder().build();

      renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() =>
        expect(mockRequestFactoryResolver).toHaveBeenCalledWith(
          factoryUrl,
          expect.objectContaining({
            overrides: expectedOverrideParams,
          }),
        ),
      );
    });

    test(`resolve a broken url`, async () => {
      const emptyStore = new FakeStoreBuilder().build();

      const rejectReason = 'Not found.';
      mockRequestFactoryResolver.mockRejectedValueOnce(rejectReason);

      renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      const alertTitle = screen.getByTestId('alert-title');
      expect(alertTitle.textContent).toEqual('Failed to create the workspace');

      const alertBody = screen.getByTestId('alert-body');
      expect(alertBody.textContent).toEqual(rejectReason);

      expect(mockOnNextStep).not.toHaveBeenCalled();
    });

    test('devfile took more than TIMEOUT_TO_RESOLVE_SEC to resolve', async () => {
      const emptyStore = new FakeStoreBuilder().build();

      renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      expect(hasError.textContent).toEqual('false');

      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();

      // wait a bit more than necessary to end the devfile resolving timeout
      const time = (TIMEOUT_TO_RESOLVE_SEC + 1) * 1000;
      jest.advanceTimersByTime(time);

      await waitFor(() => expect(hasError.textContent).toEqual('true'));

      const alertTitle = screen.getByTestId('alert-title');
      expect(alertTitle.textContent).toEqual('Failed to create the workspace');

      const alertBody = screen.getByTestId('alert-body');
      expect(alertBody.textContent).toEqual(`Devfile hasn't been resolved in the last 20 seconds.`);

      expect(mockOnNextStep).not.toHaveBeenCalled();
    });

    test('devfile resolved successfully', async () => {
      const emptyStore = new FakeStoreBuilder().build();

      const { reRenderComponent } = renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const currentStepId = screen.getByTestId('current-step-id');
      await waitFor(() => expect(currentStepId.textContent).toEqual(stepId));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      expect(hasError.textContent).toEqual('false');

      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalled());
      expect(mockOnNextStep).not.toHaveBeenCalled();

      // wait a bit less than the devfile resolving timeout
      const time = (TIMEOUT_TO_RESOLVE_SEC - 1) * 1000;
      jest.advanceTimersByTime(time);

      // build next store
      const nextStore = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            location: factoryUrl,
          },
          converted: {
            devfileV2: {} as devfileApi.Devfile,
          },
        })
        .build();
      reRenderComponent(nextStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(hasError.textContent).toEqual('false'));

      await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());
    });
  });

  describe('private devfile', () => {
    const oauthAuthenticationUrl = 'https://oauth_authentication_url';
    const host = 'che-host';
    const protocol = 'http://';
    let spyWindowLocation: jest.SpyInstance;

    beforeEach(() => {
      mockIsOAuthResponse.mockReturnValue(true);
      mockRequestFactoryResolver.mockRejectedValue({
        attributes: {
          oauth_provider: 'oauth_provider',
          oauth_authentication_url: oauthAuthenticationUrl,
        },
      } as OAuthResponse);

      spyWindowLocation = createWindowLocationSpy(host, protocol);
    });

    afterEach(() => {
      sessionStorage.clear();
      spyWindowLocation.mockClear();
    });

    test('redirect to an authentication URL', async () => {
      const emptyStore = new FakeStoreBuilder().build();

      renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const expectedRedirectUrl = `${oauthAuthenticationUrl}/&redirect_after_login=${protocol}${host}/f?url=${encodeURIComponent(
        factoryUrl,
      )}`;

      await waitFor(() => expect(spyWindowLocation).toHaveBeenCalledWith(expectedRedirectUrl));

      expect(mockOnNextStep).not.toHaveBeenCalled();
    });

    test('authentication fails', async () => {
      const emptyStore = new FakeStoreBuilder().build();

      renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      const expectedRedirectUrl = `${oauthAuthenticationUrl}/&redirect_after_login=${protocol}${host}/f?url=${encodeURIComponent(
        factoryUrl,
      )}`;

      await waitFor(() => expect(spyWindowLocation).toHaveBeenCalledWith(expectedRedirectUrl));

      // cleanup previous render
      cleanup();

      // first unsuccessful try to resolve devfile after authentication
      renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(spyWindowLocation).toHaveBeenCalledWith(expectedRedirectUrl));

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      expect(hasError.textContent).toEqual('false');

      // cleanup previous render
      cleanup();

      // second unsuccessful try to resolve devfile after authentication
      renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(spyWindowLocation).toHaveBeenCalledWith(expectedRedirectUrl));

      const currentStepRerendered = screen.getByTestId(stepId);
      const hasErrorRerendered = within(currentStepRerendered).getByTestId('hasError');
      await waitFor(() => expect(hasErrorRerendered.textContent).toEqual('true'));

      const alertTitle = screen.getByTestId('alert-title');
      expect(alertTitle.textContent).toEqual('Failed to create the workspace');

      const alertBody = screen.getByTestId('alert-body');
      expect(alertBody.textContent).toEqual(
        'The Dashboard reached a limit of reloads while trying to resolve a devfile in a private repo. Please contact admin to check if OAuth is configured correctly.',
      );

      expect(mockOnNextStep).not.toHaveBeenCalled();
    });

    test('authentication passes', async () => {
      const emptyStore = new FakeStoreBuilder().build();

      renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalled());

      // cleanup previous render
      cleanup();

      // the devfile should be resolved now
      mockRequestFactoryResolver.mockResolvedValue(undefined);

      // redirect after authentication
      const { reRenderComponent } = renderComponent(emptyStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockRequestFactoryResolver).toHaveBeenCalled());

      // build next store
      const nextStore = new FakeStoreBuilder()
        .withFactoryResolver({
          resolver: {
            location: factoryUrl,
          },
          converted: {
            devfileV2: {} as devfileApi.Devfile,
          },
        })
        .build();
      reRenderComponent(nextStore, loaderSteps, searchParams);

      jest.advanceTimersByTime(MIN_STEP_DURATION_MS);

      await waitFor(() => expect(mockOnNextStep).toHaveBeenCalled());

      const currentStep = screen.getByTestId(stepId);
      const hasError = within(currentStep).getByTestId('hasError');
      expect(hasError.textContent).toEqual('false');
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

function getComponent(
  store: Store,
  loaderSteps: List<LoaderStep>,
  searchParams: URLSearchParams,
  stepIndex = currentStepIndex,
  localState?: Partial<State>,
): React.ReactElement {
  const history = createMemoryHistory();
  const component = (
    <StepFetchDevfile
      currentStepIndex={stepIndex}
      history={history}
      loaderSteps={loaderSteps}
      searchParams={searchParams}
      tabParam={undefined}
      onNextStep={mockOnNextStep}
      onRestart={mockOnRestart}
      onTabChange={mockOnTabChange}
    />
  );
  if (localState) {
    return (
      <Provider store={store}>
        <StateMock state={localState}>{component}</StateMock>
      </Provider>
    );
  } else {
    return <Provider store={store}>{component}</Provider>;
  }
}
