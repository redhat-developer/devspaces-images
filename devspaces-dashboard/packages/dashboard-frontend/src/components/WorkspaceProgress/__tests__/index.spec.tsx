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
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, History, MemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import Progress, { State, Step } from '..';
import { ROUTE } from '../../../Routes/routes';
import devfileApi from '../../../services/devfileApi';
import {
  buildFactoryParams,
  DEV_WORKSPACE_ATTR,
  FACTORY_URL_ATTR,
} from '../../../services/helpers/factoryFlow/buildFactoryParams';
import { buildIdeLoaderLocation } from '../../../services/helpers/location';
import { constructWorkspace } from '../../../services/workspace-adapter';
import getComponentRenderer, {
  screen,
  waitFor,
  within,
} from '../../../services/__mocks__/getComponentRenderer';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';

jest.mock('../CommonSteps/CheckRunningWorkspacesLimit');
jest.mock('../CreatingSteps/Apply/Devfile');
jest.mock('../CreatingSteps/Apply/Resources');
jest.mock('../CreatingSteps/CheckExistingWorkspaces');
jest.mock('../CreatingSteps/CreateWorkspace');
jest.mock('../CreatingSteps/Fetch/Devfile');
jest.mock('../CreatingSteps/Fetch/Resources');
jest.mock('../CreatingSteps/Initialize');
jest.mock('../StartingSteps/Initialize');
jest.mock('../StartingSteps/OpenWorkspace');
jest.mock('../StartingSteps/StartWorkspace');
jest.mock('../StartingSteps/WorkspaceConditions');

const { renderComponent, createSnapshot } = getComponentRenderer(getComponent);

const mockOnTabChange = jest.fn();

describe('LoaderProgress', () => {
  let history: MemoryHistory;
  let searchParams: URLSearchParams;

  describe('workspace creation flow', () => {
    const factoryUrl = 'https://factory-url';

    beforeEach(() => {
      history = createMemoryHistory({
        initialEntries: [ROUTE.FACTORY_LOADER],
      });

      searchParams = new URLSearchParams({
        [FACTORY_URL_ATTR]: factoryUrl,
      });
    });

    test('snapshot', () => {
      const store = new FakeStoreBuilder().build();
      const snapshot = createSnapshot(history, store, searchParams, false);
      expect(snapshot).toMatchSnapshot();
    });

    describe('steps number', () => {
      test('flow with devfile', () => {
        const store = new FakeStoreBuilder().build();

        renderComponent(history, store, searchParams, false);

        const steps = getSteps();

        expect(steps.length).toEqual(8);

        expect(within(steps[0]).getByTestId('step-name')).toHaveTextContent('Initialize');
        expect(within(steps[1]).getByTestId('step-name')).toHaveTextContent(
          'Check running workspaces limit',
        );
        expect(within(steps[2]).getByTestId('step-name')).toHaveTextContent('Create workspace');
        expect(within(steps[3]).getByTestId('step-name')).toHaveTextContent('Fetch devfile');
        expect(within(steps[4]).getByTestId('step-name')).toHaveTextContent(
          'Check existing workspaces',
        );
        expect(within(steps[5]).getByTestId('step-name')).toHaveTextContent('Apply devfile');
        expect(within(steps[6]).getByTestId('step-name')).toHaveTextContent('Start workspace');
        expect(within(steps[7]).getByTestId('step-name')).toHaveTextContent('Open workspace');
      });

      test('flow with resources', () => {
        const store = new FakeStoreBuilder().build();

        searchParams.append(DEV_WORKSPACE_ATTR, 'resources-location');
        renderComponent(history, store, searchParams, false);

        const steps = getSteps();

        expect(steps.length).toEqual(8);

        expect(within(steps[0]).getByTestId('step-name')).toHaveTextContent('Initialize');
        expect(within(steps[1]).getByTestId('step-name')).toHaveTextContent(
          'Check running workspaces limit',
        );
        expect(within(steps[2]).getByTestId('step-name')).toHaveTextContent('Create workspace');
        expect(within(steps[3]).getByTestId('step-name')).toHaveTextContent('Fetch resources'); // <-- this is different
        expect(within(steps[4]).getByTestId('step-name')).toHaveTextContent(
          'Check existing workspaces',
        );
        expect(within(steps[5]).getByTestId('step-name')).toHaveTextContent('Apply resources'); // <-- this is different
        expect(within(steps[6]).getByTestId('step-name')).toHaveTextContent('Start workspace');
        expect(within(steps[7]).getByTestId('step-name')).toHaveTextContent('Open workspace');
      });
    });

    describe('handle step events', () => {
      function getAlertGroup() {
        return screen.queryByRole('list', { name: 'Loader Alerts Group' });
      }

      function triggerStepEvent(step: HTMLElement, event: 'onError' | 'onNextStep' | 'onRestart') {
        const errorButton = within(step).getByRole('button', { name: event });
        userEvent.click(errorButton);
      }

      describe('onError', () => {
        test('alert notification for the active step', () => {
          const store = new FakeStoreBuilder().build();

          renderComponent(history, store, searchParams, false);

          /* no alert notification */
          expect(getAlertGroup()).toBeNull();

          const steps = getSteps();

          // trigger an error in the first (active) step
          triggerStepEvent(steps[0], 'onError');

          /* alert notification in document */

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const alertGroup = getAlertGroup()!;
          expect(getAlertGroup).not.toBeNull();

          expect(
            within(alertGroup).queryByText('Error in step Creating step: Initialize'),
          ).not.toBeNull();
        });

        test('handle error for an non-active step', () => {
          const store = new FakeStoreBuilder().build();

          renderComponent(history, store, searchParams, false);

          /* no alert notification */
          expect(getAlertGroup()).toBeNull();

          const steps = getSteps();

          /* trigger an error in the second (non-active) step */
          triggerStepEvent(steps[1], 'onError');

          /* still no alert notifications in the document */
          expect(getAlertGroup()).toBeNull();
        });
      });

      describe('onNextStep', () => {
        test('on active step', async () => {
          const store = new FakeStoreBuilder().build();

          renderComponent(history, store, searchParams, false);

          const steps = getSteps();

          // first step distance (active)
          expect(within(steps[0]).getByTestId('step-distance').textContent).toEqual('0');

          // second step distance (non-active)
          expect(within(steps[1]).getByTestId('step-distance').textContent).toEqual('-1');

          // trigger onNextStep on the active step
          const onNextStepButton = within(steps[0]).getByRole('button', { name: 'onNextStep' });
          userEvent.click(onNextStepButton);

          // first step distance incremented (non-active)
          await waitFor(() =>
            expect(within(steps[0]).getByTestId('step-distance').textContent).toEqual('1'),
          );

          // second step distance incremented (active)
          expect(within(steps[1]).getByTestId('step-distance').textContent).toEqual('0');
        });

        test('on non-active step', async () => {
          const store = new FakeStoreBuilder().build();

          renderComponent(history, store, searchParams, false);

          const steps = getSteps();

          // first step distance (active)
          expect(within(steps[0]).getByTestId('step-distance').textContent).toEqual('0');

          // second step distance (non-active)
          expect(within(steps[1]).getByTestId('step-distance').textContent).toEqual('-1');

          // trigger onNextStep on the non-active step
          const onNextStepButton = within(steps[1]).getByRole('button', { name: 'onNextStep' });
          userEvent.click(onNextStepButton);

          // first step distance does not change (active)
          await waitFor(() =>
            expect(within(steps[0]).getByTestId('step-distance').textContent).toEqual('0'),
          );

          // second step distance does not change (non-active)
          expect(within(steps[1]).getByTestId('step-distance').textContent).toEqual('-1');
        });
      });

      describe('onRestart', () => {
        test('on active step, during creation flow', async () => {
          const store = new FakeStoreBuilder().build();

          const factoryParams = buildFactoryParams(searchParams);
          const localState: Partial<State> = {
            alertItems: [],
            // active step is "check running workspaces limit"
            activeStepId: Step.LIMIT_CHECK,
            // step "initialize" is done
            doneSteps: [Step.INITIALIZE],
            factoryParams,
            initialLoaderMode: {
              mode: 'factory',
            },
          };
          renderComponent(history, store, searchParams, false, localState);

          const steps = getSteps();

          // first step distance (non-active)
          expect(within(steps[0]).getByTestId('step-distance').textContent).toEqual('1');

          // second step distance (active)
          expect(within(steps[1]).getByTestId('step-distance').textContent).toEqual('0');

          // trigger onRestart on the active step
          const onRestart = within(steps[1]).getByRole('button', { name: 'onRestart' });
          userEvent.click(onRestart);

          // first step distance becomes 0 (active)
          await waitFor(() =>
            expect(within(steps[0]).getByTestId('step-distance').textContent).toEqual('0'),
          );

          // second step distance becomes -1 (non-active)
          expect(within(steps[1]).getByTestId('step-distance').textContent).toEqual('-1');
        });

        test('on active step, during starting flow', async () => {
          // the location is changed after the transition to the starting flow
          const devWorkspace = new DevWorkspaceBuilder()
            .withName('my-workspace')
            .withNamespace('user-che')
            .build();
          const location = buildIdeLoaderLocation(constructWorkspace(devWorkspace));
          history = createMemoryHistory({
            initialEntries: [location],
          });

          const store = new FakeStoreBuilder().build();

          const factoryParams = buildFactoryParams(searchParams);
          const localState: Partial<State> = {
            alertItems: [],
            // active step is "check running workspaces limit"
            activeStepId: Step.OPEN, // <-- 8th step, active
            doneSteps: [
              Step.INITIALIZE,
              Step.LIMIT_CHECK,
              Step.CREATE,
              Step.FETCH,
              Step.CONFLICT_CHECK,
              Step.APPLY,
              Step.START, // <-- 7th step, non-active
            ],
            factoryParams,
            initialLoaderMode: {
              mode: 'factory',
            },
            conditions: [],
          };
          renderComponent(history, store, searchParams, false, localState);

          const steps = getSteps();

          // 7th step distance (non-active)
          expect(within(steps[6]).getByTestId('step-distance').textContent).toEqual('1');

          // 8th step distance (active)
          expect(within(steps[7]).getByTestId('step-distance').textContent).toEqual('0');

          // trigger onRestart on the active step
          const onRestart = within(steps[7]).getByRole('button', { name: 'onRestart' });
          userEvent.click(onRestart);

          // 7th step distance becomes 0 (active)
          await waitFor(() =>
            expect(within(steps[6]).getByTestId('step-distance').textContent).toEqual('0'),
          );

          // 8th step distance becomes -1 (non-active)
          expect(within(steps[7]).getByTestId('step-distance').textContent).toEqual('-1');
        });

        test('on non-active step', async () => {
          const store = new FakeStoreBuilder().build();

          const factoryParams = buildFactoryParams(searchParams);
          const localState: Partial<State> = {
            alertItems: [],
            // active step is "check running workspaces limit"
            activeStepId: Step.LIMIT_CHECK,
            // step "initialize" is done
            doneSteps: [Step.INITIALIZE],
            factoryParams,
            initialLoaderMode: {
              mode: 'factory',
            },
          };
          renderComponent(history, store, searchParams, false, localState);

          const steps = getSteps();

          // first step distance (non-active)
          expect(within(steps[0]).getByTestId('step-distance').textContent).toEqual('1');

          // second step distance (active)
          expect(within(steps[1]).getByTestId('step-distance').textContent).toEqual('0');

          // trigger onRestart on the non-active step
          const onRestart = within(steps[0]).getByRole('button', { name: 'onRestart' });
          userEvent.click(onRestart);

          // first step distance becomes 0 (active)
          await waitFor(() =>
            expect(within(steps[0]).getByTestId('step-distance').textContent).toEqual('1'),
          );

          // second step distance becomes -1 (non-active)
          expect(within(steps[1]).getByTestId('step-distance').textContent).toEqual('0');
        });
      });
    });
  });

  describe('workspace staring flow', () => {
    const namespace = 'che-user';
    const workspaceName = 'project-1';
    let devWorkspace: devfileApi.DevWorkspace;

    beforeEach(() => {
      devWorkspace = new DevWorkspaceBuilder()
        .withName(workspaceName)
        .withNamespace(namespace)
        .withStatus({
          conditions: [
            {
              type: 'Started',
              status: 'True',
              message: '"Started" message',
            },
            {
              type: 'DevWorkspaceResolved',
              status: 'False',
              message: '"DevWorkspaceResolved" message',
            },
          ],
          phase: 'STARTING',
        })
        .build();
      const location = buildIdeLoaderLocation(constructWorkspace(devWorkspace));
      history = createMemoryHistory({
        initialEntries: [location],
      });

      searchParams = new URLSearchParams({});
    });

    test('snapshot', () => {
      const store = new FakeStoreBuilder().build();
      const snapshot = createSnapshot(history, store, searchParams, false);
      expect(snapshot).toMatchSnapshot();
    });

    describe('steps number', () => {
      test('no condition steps', () => {
        const store = new FakeStoreBuilder().build();

        renderComponent(history, store, searchParams, false);

        const steps = getSteps();

        expect(steps.length).toEqual(4);

        expect(within(steps[0]).getByTestId('step-name')).toHaveTextContent('Initialize');
        expect(within(steps[1]).getByTestId('step-name')).toHaveTextContent(
          'Check running workspaces limit',
        );
        expect(within(steps[2]).getByTestId('step-name')).toHaveTextContent('Start workspace');
        expect(within(steps[3]).getByTestId('step-name')).toHaveTextContent('Open workspace');
      });

      test('with condition steps', () => {
        const store = new FakeStoreBuilder()
          .withDevWorkspaces({ workspaces: [devWorkspace] })
          .build();

        renderComponent(history, store, searchParams, false);

        const steps = getSteps();

        expect(steps.length).toEqual(6);

        expect(within(steps[0]).getByTestId('step-name')).toHaveTextContent('Initialize');
        expect(within(steps[1]).getByTestId('step-name')).toHaveTextContent(
          'Check running workspaces limit',
        );
        expect(within(steps[2]).getByTestId('step-name')).toHaveTextContent('Start workspace');
        expect(within(steps[3]).getByTestId('step-name')).toHaveTextContent('Workspace conditions'); // <-- condition step
        expect(within(steps[4]).getByTestId('step-name')).toHaveTextContent('Workspace conditions'); // <-- condition step
        expect(within(steps[5]).getByTestId('step-name')).toHaveTextContent('Open workspace');
      });
    });
  });
});

function getSteps() {
  const steps = screen.getAllByTestId('progress-step');
  return steps;
}

function getComponent(
  history: History,
  store: Store,
  searchParams: URLSearchParams,
  showToastAlert: boolean,
  localState?: Partial<State>,
) {
  const component = (
    <Progress
      history={history}
      searchParams={searchParams}
      showToastAlert={showToastAlert}
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
