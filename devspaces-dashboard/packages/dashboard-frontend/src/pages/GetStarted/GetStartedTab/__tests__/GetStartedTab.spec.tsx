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
import { RenderResult, render, screen } from '@testing-library/react';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { SamplesListTab } from '..';
import { selectIsLoading } from '../../../../store/Workspaces/selectors';
import {
  selectPreferredStorageType,
  selectWorkspacesSettings,
} from '../../../../store/Workspaces/Settings/selectors';
import { BrandingData } from '../../../../services/bootstrap/branding.constant';
import { Devfile } from '../../../../services/workspace-adapter';

const onDevfileMock: (
  devfileContent: string,
  stackName: string,
  optionalFilesContent?: { [fileName: string]: string },
) => Promise<void> = jest.fn().mockResolvedValue(true);

const testStackName = 'http://test-location/';
const testDevfileName = 'Custom Devfile';
const testDevfile = {
  apiVersion: '1.0.0',
  metadata: { name: testDevfileName },
} as Devfile;

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
      .withWorkspacesSettings({
        'che.workspace.storage.preferred_type': preferredStorageType,
      } as che.WorkspaceSettings)
      .withCheWorkspaces({
        workspaces: [],
      })
      .withBranding(brandingData)
      .build();

    const state = store.getState();

    return render(
      <Provider store={store}>
        <SamplesListTab
          onDevfile={onDevfileMock}
          isLoading={selectIsLoading(state)}
          workspacesSettings={selectWorkspacesSettings(state)}
          preferredStorageType={selectPreferredStorageType(state)}
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
      expect.not.stringContaining('persistVolumes:'),
      testStackName,
      undefined,
    );
    expect(onDevfileMock).toHaveBeenCalledWith(
      expect.not.stringContaining('asyncPersist:'),
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
      expect.not.stringContaining('persistVolumes:'),
      testStackName,
      undefined,
    );
    expect(onDevfileMock).toHaveBeenCalledWith(
      expect.not.stringContaining('asyncPersist:'),
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
      expect.stringContaining("persistVolumes: 'false'"),
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
      expect.stringContaining("persistVolumes: 'false'"),
      testStackName,
      undefined,
    );
    expect(onDevfileMock).toHaveBeenCalledWith(
      expect.stringContaining("asyncPersist: 'true'"),
      testStackName,
      undefined,
    );
  });

  it('should correctly apply the storage type "async"', () => {
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
      expect.stringContaining("persistVolumes: 'false'"),
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
      expect.not.stringContaining('persistVolumes:'),
      testStackName,
      undefined,
    );
    expect(onDevfileMock).toHaveBeenCalledWith(
      expect.not.stringContaining('asyncPersist:'),
      testStackName,
      undefined,
    );
  });
});
