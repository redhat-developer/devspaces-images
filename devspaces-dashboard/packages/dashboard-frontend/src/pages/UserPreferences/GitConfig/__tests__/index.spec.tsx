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

import { AlertVariant } from '@patternfly/react-core';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Action, Store } from 'redux';

import { container } from '@/inversify.config';
import { mockShowAlert } from '@/pages/WorkspaceDetails/__mocks__';
import getComponentRenderer, { screen, waitFor } from '@/services/__mocks__/getComponentRenderer';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { AlertItem } from '@/services/helpers/types';
import { AppThunk } from '@/store';
import { FakeStoreBuilder } from '@/store/__mocks__/storeBuilder';
import { ActionCreators } from '@/store/GitConfig';

import GitConfig from '..';

jest.mock('../SectionUser');

// mute output
console.error = jest.fn();

const mockRequestGitConfig = jest.fn();
const mockUpdateGitConfig = jest.fn();
jest.mock('../../../../store/GitConfig', () => ({
  actionCreators: {
    requestGitConfig:
      (...args): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockRequestGitConfig(...args),
    updateGitConfig:
      (...args): AppThunk<Action, Promise<void>> =>
      async (): Promise<void> =>
        mockUpdateGitConfig(...args),
  } as ActionCreators,
}));

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

let store: Store;
let storeEmpty: Store;

describe('GitConfig', () => {
  beforeEach(() => {
    store = new FakeStoreBuilder()
      .withGitConfig({
        config: {
          gitconfig: {
            user: {
              name: 'user',
              email: 'user@che',
            },
          },
        },
      })
      .build();
    storeEmpty = new FakeStoreBuilder().build();

    class MockAppAlerts extends AppAlerts {
      showAlert(alert: AlertItem): void {
        mockShowAlert(alert);
      }
    }

    container.snapshot();
    container.rebind(AppAlerts).to(MockAppAlerts).inSingletonScope();
  });

  afterEach(() => {
    jest.clearAllMocks();
    container.restore();
  });

  describe('snapshot', () => {
    test('with no gitconfig', () => {
      const snapshot = createSnapshot(storeEmpty);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });

    test('with gitconfig', () => {
      const snapshot = createSnapshot(store);
      expect(snapshot.toJSON()).toMatchSnapshot();
    });
  });

  describe('empty state', () => {
    it('should render empty state when there is not gitconfig', () => {
      renderComponent(storeEmpty);

      expect(screen.queryByRole('heading', { name: 'No gitconfig found' })).not.toBeNull();
    });

    it('should request gitconfig', () => {
      renderComponent(storeEmpty);

      expect(mockRequestGitConfig).toHaveBeenCalled();
    });
  });

  describe('while loading', () => {
    it('should not request gitconfig', () => {
      const store = new FakeStoreBuilder()
        .withGitConfig(
          {
            config: undefined,
          },
          true,
        )
        .build();
      renderComponent(store);

      expect(mockRequestGitConfig).not.toHaveBeenCalled();
    });
  });

  describe('with data', () => {
    it('should update the git config and show a success notification', async () => {
      renderComponent(store);

      const changeEmailButton = screen.getByRole('button', { name: 'Change Email' });
      userEvent.click(changeEmailButton);

      // mock should be called
      expect(mockUpdateGitConfig).toHaveBeenCalled();

      // success alert should be shown
      await waitFor(() =>
        expect(mockShowAlert).toHaveBeenCalledWith({
          key: 'gitconfig-success',
          title: 'Gitconfig saved successfully.',
          variant: AlertVariant.success,
        } as AlertItem),
      );
    });

    it('should try to update the gitconfig and show alert notification', async () => {
      const { reRenderComponent } = renderComponent(store);

      mockUpdateGitConfig.mockRejectedValueOnce(new Error('update gitconfig error'));

      const changeEmailButton = screen.getByRole('button', { name: 'Change Email' });
      userEvent.click(changeEmailButton);

      // mock should be called
      expect(mockUpdateGitConfig).toHaveBeenCalled();

      // error alert should not be shown
      expect(mockShowAlert).not.toHaveBeenCalled();

      const nextStore = new FakeStoreBuilder()
        .withGitConfig({
          config: {
            gitconfig: {
              user: {
                name: 'user',
                email: 'user@che',
              },
            },
          },
          error: 'update gitconfig error',
        })
        .build();
      reRenderComponent(nextStore);

      // error alert should be shown
      await waitFor(() =>
        expect(mockShowAlert).toHaveBeenCalledWith({
          key: 'gitconfig-error',
          title: 'update gitconfig error',
          variant: AlertVariant.danger,
        } as AlertItem),
      );
    });
  });
});

function getComponent(store: Store): React.ReactElement {
  return (
    <Provider store={store}>
      <GitConfig />
    </Provider>
  );
}
