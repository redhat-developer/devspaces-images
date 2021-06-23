/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { Provider } from 'react-redux';
import { Action, Store } from 'redux';
import mockAxios from 'axios';
import React from 'react';
import { RenderResult, render, screen, fireEvent, waitFor } from '@testing-library/react';
import DevfileSelectorFormGroup from '../';
import mockMetadata from '../../../__tests__/devfileMetadata.json';
import { FakeStoreBuilder } from '../../../../../store/__mocks__/storeBuilder';
import * as FactoryResolverStore from '../../../../../store/FactoryResolver';
import { AppThunk } from '../../../../../store';

// mute the outputs
console.error = jest.fn();

jest.mock('../../../../../store/FactoryResolver.ts', () => {
  return {
    actionCreators: {
      requestFactoryResolver: (location: string): AppThunk<Action, Promise<void>> => async (): Promise<void> => {
        if (/nonexisting/.test(location)) {
          return Promise.reject();
        }
        return Promise.resolve();
      }
    } as FactoryResolverStore.ActionCreators,
  };
});

describe('Devfile Selector', () => {

  const mockOnDevfile = jest.fn();
  const mockOnClear = jest.fn();

  function renderComponent(store: Store): RenderResult {
    return render(
      <Provider store={store}>
        <DevfileSelectorFormGroup
          onDevfile={mockOnDevfile}
          onClear={mockOnClear}
        />
      </Provider>
    );
  }

  let loadButton: HTMLInputElement;
  let locationTextbox: HTMLInputElement;
  let selectToggleButton: HTMLButtonElement;
  beforeEach(() => {
    const store = new FakeStoreBuilder()
      .withDevfileRegistries({
        registries: {
          'registry-location': {
            metadata: mockMetadata,
          },
        },
      })
      .build();
    renderComponent(store);

    loadButton = screen.getByRole('button', { name: 'Load Devfile' }) as HTMLInputElement;
    locationTextbox = screen.getByRole('textbox', { name: 'URL of devfile' }) as HTMLInputElement;
    selectToggleButton = screen.getByRole('button', { name: /Select a devfile template/ }) as HTMLButtonElement;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly component', () => {
    expect(loadButton).toBeDisabled();
    expect(locationTextbox).not.toHaveValue();
    expect(screen.queryByText(/failed to load/i)).not.toBeInTheDocument();
  });

  describe('selecting a devfile template', () => {

    const expectedMeta = JSON.stringify({
      displayName: 'Java Maven Stub',
    } as che.DevfileMetaData);

    beforeEach(() => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: expectedMeta,
      });

      /* select a devfile from the list of options */
      fireEvent.click(selectToggleButton);
      const option = screen.getByRole('option', { name: 'Java Maven' });
      fireEvent.click(option);
    });

    it('should apply the selected option', async () => {
      /* check if selected option is applied */
      await waitFor(() => {
        expect(screen.getByDisplayValue('Java Maven')).toBeInTheDocument();
      });
    });

    it('should call "onDevfile" callback', async () => {
      /* wait until selected option is applied */
      await waitFor(() => {
        screen.queryByRole('button', { name: 'Java Maven' });
      });

      expect(mockOnDevfile).toHaveBeenCalledWith(JSON.parse(expectedMeta));
    });

    it('should not show a danger alert notification', () => {
      waitFor(() => {
        expect(screen.queryByText(/failed to load/i)).not.toBeInTheDocument();
      });
    });

  });

  describe('selecting a devfile template when location is not empty', () => {

    const expectedMeta = JSON.stringify({
      displayName: 'Java Maven Stub',
    } as che.DevfileMetaData);

    beforeEach(() => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: expectedMeta,
      });

      /* enter devfile location into location input */
      fireEvent.change(locationTextbox, { target: { value: 'http://resource/location' } });

      /* select a devfile from the list of options */
      fireEvent.click(selectToggleButton);
      const option = screen.getByRole('option', { name: 'Java Maven' });
      fireEvent.click(option);
    });

    it('should clear input', () => {
      /* check if location input is clear */
      expect(locationTextbox).not.toHaveValue();
    });

    it('should disable "Load Devfile" button', () => {
      expect(loadButton).toBeDisabled();
    });

  });

  describe('selecting a devfile template when request to registry failed', () => {

    beforeEach(() => {
      (mockAxios.get as jest.Mock).mockRejectedValueOnce({});

      /* select a devfile from the list of options */
      fireEvent.click(selectToggleButton);

      const option = screen.getByRole('option', { name: 'Java Maven' });
      fireEvent.click(option);
    });

    it('should apply the selected option', async () => {
      /* check if selected option is applied */
      await waitFor(() => {
        expect(screen.getByDisplayValue('Java Maven')).toBeInTheDocument();
      });
    });

    it('should not call "onDevfile" callback', () => {
      expect(mockOnDevfile).not.toHaveBeenCalled();
    });

    it('should show a danger alert notification', async () => {
      await waitFor(() => {
        expect(screen.queryByText(/failed to load/i)).toBeInTheDocument();
      });
    });

  });

  describe('typing a custom devfile location', () => {

    beforeEach(() => {
      /* enter devfile location into location input */
      fireEvent.change(locationTextbox, { target: { value: 'http://resource/location' } });
    });

    it('should enable "Load Devfile" button', () => {
      expect(loadButton).toBeInTheDocument();
      expect(loadButton).toBeEnabled();
    });

  });

  describe('clicking on "Load devfile" button', () => {

    beforeEach(() => {
      /* enter devfile location into location input */
      fireEvent.change(locationTextbox, { target: { value: 'http://resource/location' } });

      fireEvent.click(loadButton);
    });

    it('should call "onDevfile" callback', async () => {
      await waitFor(() => {
        expect(mockOnDevfile).toHaveBeenCalled();
      });
    });

  });

  describe('clicking on "Load devfile" button when a template is selected', () => {

    const expectedMeta = JSON.stringify({
      displayName: 'Java Maven Stub',
    } as che.DevfileMetaData);

    beforeEach(() => {
      (mockAxios.get as jest.Mock).mockResolvedValueOnce({
        data: expectedMeta,
      });

      /* enter devfile location into location input */
      fireEvent.change(locationTextbox, { target: { value: 'http://resource/location' } });

      /* select a devfile from the list of options */
      fireEvent.click(selectToggleButton);
      const option = screen.getByRole('option', { name: 'Java Maven' });

      fireEvent.click(option);
    });

    it('should clear the selected devfile template', async () => {
      await waitFor(() => {
        expect(screen.queryByText('Java Maven')).not.toBeInTheDocument();
      });
    });

  });

  describe('clicking on "Load devfile" button when request failed', () => {

    beforeEach(() => {
      /* enter devfile location into location input */
      fireEvent.change(locationTextbox, { target: { value: 'http://nonexisting/resource/location' } });

      fireEvent.click(loadButton);
    });

    it('should not call "onDevfile" callback', async () => {
      await waitFor(() => {
        expect(mockOnDevfile).not.toHaveBeenCalled();
      });
    });

    it('should show a danger alert notification', () => {
      waitFor(() => {
        expect(screen.queryByText(/failed to load/i)).toBeInTheDocument();
      });
    });

  });

});
