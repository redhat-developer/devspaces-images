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
import { Store } from 'redux';
import { render, screen, RenderResult, fireEvent, waitFor } from '@testing-library/react';
import mockAxios from 'axios';
import SamplesListGallery from '../SamplesListGallery';
import { Provider } from 'react-redux';
import mockMetadata from '../../__tests__/devfileMetadata.json';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { BrandingData } from '../../../../services/bootstrap/branding.constant';
import { WorkspaceSettings } from 'che';

const requestFactoryResolverMock = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../../store/FactoryResolver', () => {
  return {
    actionCreators: {
      requestFactoryResolver: (location: string, overrideParams?: {
        [params: string]: string
      }) => async (): Promise<void> => {
        if (!overrideParams) {
          requestFactoryResolverMock(location);
        } else {
          requestFactoryResolverMock(location, overrideParams);
        }
      }
    }
  };
});

describe('Samples List Gallery', () => {

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  function renderGallery(
    store: Store,
    onCardClicked: () => void = (): void => undefined
  ): RenderResult {
    return render(
      <Provider store={store}>
        <SamplesListGallery onCardClick={onCardClicked} />
      </Provider>
    );
  }

  it('should render cards with metadata', () => {
    // eslint-disable-next-line
    const store = createFakeStoreWithMetadata();
    renderGallery(store);

    const cards = screen.getAllByRole('article');
    expect(cards.length).toEqual(26);
  });

  it('should render cards with v2 metadata only', () => {
    // eslint-disable-next-line
    const store = createFakeStoreWithMetadata(true);
    renderGallery(store);

    const cards = screen.getAllByRole('article');
    // only one link is with devfile v2 format
    expect(cards.length).toEqual(1);

  });

  it('should handle "onCardClick" event', async () => {

    let resolveFn: {
      (value?: unknown): void;
    };
    const onCardClickedPromise = new Promise(resolve => resolveFn = resolve);
    const onCardClicked = jest.fn(() => resolveFn());

    // eslint-disable-next-line
    const store = createFakeStoreWithMetadata();
    renderGallery(store, onCardClicked);

    (mockAxios.get as any).mockResolvedValueOnce({
      data: {},
    });

    const cardHeader = screen.getByText('Go');
    fireEvent.click(cardHeader);

    await onCardClickedPromise;
    expect(onCardClicked).toHaveBeenCalled();

  });

  it('should handle "onCardClick" event for v2 metadata', async () => {

    let resolveFn: {
      (value?: unknown): void;
    };
    const onCardClickedPromise = new Promise(resolve => resolveFn = resolve);
    const onCardClicked = jest.fn(() => resolveFn());

    // eslint-disable-next-line
    const store = createFakeStoreWithMetadata(true);
    renderGallery(store, onCardClicked);

    (mockAxios.get as any).mockResolvedValueOnce({
      data: {},
    });

    const cardHeader = screen.getByText('Java with Spring Boot and MySQL');
    fireEvent.click(cardHeader);

    await onCardClickedPromise;
    expect(onCardClicked).toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    // should have been called with the v2 link
    await waitFor(() => expect(requestFactoryResolverMock).toHaveBeenCalledWith('http://my-fake-repository.com/'));

  });

  it('should render empty state', () => {
    // eslint-disable-next-line
    const store = createFakeStoreWithoutMetadata();
    renderGallery(store);

    const emptyStateTitle = screen.getByRole('heading', { name: 'No results found' });
    expect(emptyStateTitle).toBeTruthy();
  });

});

function createFakeStore(metadata?: che.DevfileMetaData[], devWorkspaceEnabled?: boolean): Store {
  const registries = {};
  if (metadata) {
    registries['registry-location'] = {
      metadata,
    };
  }
  const workspaceSettings = {};
  if (devWorkspaceEnabled) {
    workspaceSettings['che.devworkspaces.enabled'] = 'true';
  }
  return new FakeStoreBuilder()
    .withBranding({
      docs: {
        storageTypes: 'https://docs.location'
      }
    } as BrandingData)
    .withWorkspacesSettings(workspaceSettings as WorkspaceSettings)
    .withFactoryResolver({
      v: '4.0',
      source: 'devfile.yaml',
      devfile: {},
      location: 'http://fake-location',
      scm_info: {
        clone_url: 'http://github.com/clone-url',
        scm_provider: 'github'
      },
      links: []
    })
    .withDevfileRegistries({ registries })
    .build();
}

function createFakeStoreWithoutMetadata(): Store {
  return createFakeStore();
}

function createFakeStoreWithMetadata(devWorkspaceEnabled?: boolean): Store {
  return createFakeStore(mockMetadata, devWorkspaceEnabled);
}
