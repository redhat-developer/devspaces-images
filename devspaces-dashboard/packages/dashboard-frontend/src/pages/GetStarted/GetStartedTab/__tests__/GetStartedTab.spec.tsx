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
import { Provider } from 'react-redux';
import { RenderResult, render, screen } from '@testing-library/react';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { SamplesListTab } from '..';
import { BrandingData } from '../../../../services/bootstrap/branding.constant';
import { selectPvcStrategy } from '../../../../store/ServerConfig/selectors';
import { api } from '@eclipse-che/common';
import devfileApi from '../../../../services/devfileApi';

const onDevfileMock: (
  devfileContent: string,
  stackName: string,
  optionalFilesContent?: { [fileName: string]: string },
) => Promise<void> = jest.fn().mockResolvedValue(true);

const testStackName = 'http://test-location/';
const testDevfileName = 'Custom Devfile';
const testDevfile = {
  schemaVersion: '2.2.0',
  metadata: { name: testDevfileName },
} as devfileApi.Devfile;

jest.mock('../SamplesListGallery', () => {
  const FakeSamplesListGallery = (props: {
    onCardClick: (devfileContent: string, stackName: string) => void;
  }) => (
    <div>
      <button
        data-testid="sample-item-id"
        onClick={() => {
          props.onCardClick(JSON.stringify(testDevfile), testStackName);
        }}
      >
        logout
      </button>
    </div>
  );
  FakeSamplesListGallery.displayName = 'SamplesListGallery';
  return FakeSamplesListGallery;
});

describe('Samples list tab', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const renderComponent = (preferredStorageType: che.WorkspaceStorageType): RenderResult => {
    const brandingData = {
      name: 'Product Name',
      docs: {
        storageTypes: 'https://dummy.location',
      },
    } as BrandingData;
    const store = new FakeStoreBuilder()
      .withDwServerConfig({
        defaults: {
          pvcStrategy: preferredStorageType,
        },
      } as api.IServerConfig)
      .withDevWorkspaces({
        workspaces: [],
      })
      .withBranding(brandingData)
      .build();

    const state = store.getState();

    return render(
      <Provider store={store}>
        <SamplesListTab
          onDevfile={onDevfileMock}
          preferredStorageType={selectPvcStrategy(state)}
          dispatch={jest.fn()}
        />
      </Provider>,
    );
  };

  it('should correctly render the samples list component', () => {
    renderComponent('persistent');

    const switchInput = screen.queryByRole('checkbox');
    expect(switchInput).toBeDefined();

    const sampleItem = screen.queryByRole('sample-item-id');
    expect(sampleItem).toBeDefined();
  });

  it('should prevent double-clicking during the creation of a new workspace', () => {
    const preferredStorageType = 'persistent';
    renderComponent(preferredStorageType);

    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeFalsy();

    const sampleItem = screen.getByTestId('sample-item-id');
    expect(onDevfileMock).not.toBeCalled();

    sampleItem.click();
    sampleItem.click();
    expect(onDevfileMock).toBeCalledTimes(1);
    expect(onDevfileMock).toHaveBeenCalledWith(
      expect.not.stringContaining('controller.devfile.io/storage-type:'),
      testStackName,
      undefined,
    );
    (onDevfileMock as jest.Mock).mockClear();
  });

  it('should correctly apply the preferred storage type "persistent"', () => {
    const preferredStorageType = 'persistent';
    renderComponent(preferredStorageType);

    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeFalsy();

    const sampleItem = screen.getByTestId('sample-item-id');
    expect(onDevfileMock).not.toBeCalled();

    sampleItem.click();
    expect(onDevfileMock).toHaveBeenCalledWith(
      expect.not.stringContaining('controller.devfile.io/storage-type:'),
      testStackName,
      undefined,
    );
  });

  it('should correctly apply the storage type "ephemeral"', () => {
    const preferredStorageType = 'persistent';
    renderComponent(preferredStorageType);

    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeFalsy();

    const sampleItem = screen.getByTestId('sample-item-id');
    expect(onDevfileMock).not.toBeCalled();

    switchInput.click();
    expect(switchInput.checked).toBeTruthy();

    sampleItem.click();
    expect(onDevfileMock).toHaveBeenCalledWith(
      expect.stringContaining('controller.devfile.io/storage-type: ephemeral'),
      testStackName,
      undefined,
    );
  });

  it('should correctly apply the preferred storage type "async"', () => {
    const preferredStorageType = 'async';
    renderComponent(preferredStorageType);

    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeFalsy();

    const sampleItem = screen.getByTestId('sample-item-id');
    expect(onDevfileMock).not.toBeCalled();

    sampleItem.click();
    expect(onDevfileMock).toHaveBeenCalledWith(
      expect.stringContaining('controller.devfile.io/storage-type: async'),
      testStackName,
      undefined,
    );
  });

  it('should correctly apply the storage type "ephemeral"', () => {
    const preferredStorageType = 'persistent';
    renderComponent(preferredStorageType);

    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeFalsy();

    const sampleItem = screen.getByTestId('sample-item-id');
    expect(onDevfileMock).not.toBeCalled();

    switchInput.click();
    expect(switchInput.checked).toBeTruthy();

    sampleItem.click();
    expect(onDevfileMock).toHaveBeenCalledWith(
      expect.stringContaining('controller.devfile.io/storage-type: ephemeral'),
      testStackName,
      undefined,
    );
  });

  it('should correctly apply the preferred storage type "persistent"', () => {
    const preferredStorageType = 'ephemeral';
    renderComponent(preferredStorageType);

    const switchInput = screen.getByRole('checkbox') as HTMLInputElement;
    expect(switchInput.checked).toBeTruthy();

    const sampleItem = screen.getByTestId('sample-item-id');
    expect(onDevfileMock).not.toBeCalled();

    switchInput.click();
    expect(switchInput.checked).toBeFalsy();

    sampleItem.click();
    expect(onDevfileMock).toHaveBeenCalledWith(
      expect.not.stringContaining('controller.devfile.io/storage-type:'),
      testStackName,
      undefined,
    );
  });
});
