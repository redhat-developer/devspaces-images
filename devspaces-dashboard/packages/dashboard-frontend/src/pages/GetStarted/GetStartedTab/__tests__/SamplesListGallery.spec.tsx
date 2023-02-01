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
import { Store } from 'redux';
import { render, screen, RenderResult, fireEvent } from '@testing-library/react';
import mockAxios from 'axios';
import SamplesListGallery from '../SamplesListGallery';
import { Provider } from 'react-redux';
import mockMetadata from '../../__tests__/devfileMetadata.json';
import { FakeStoreBuilder } from '../../../../store/__mocks__/storeBuilder';
import { BrandingData } from '../../../../services/bootstrap/branding.constant';
import { ConvertedState } from '../../../../store/FactoryResolver';
import devfileApi from '../../../../services/devfileApi';

const requestFactoryResolverMock = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../../store/FactoryResolver', () => {
  return {
    actionCreators: {
      requestFactoryResolver:
        (
          location: string,
          overrideParams?: {
            [params: string]: string;
          },
        ) =>
        async (): Promise<void> => {
          if (!overrideParams) {
            requestFactoryResolverMock(location);
          } else {
            requestFactoryResolverMock(location, overrideParams);
          }
        },
    },
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
    onCardClicked: () => void = (): void => undefined,
  ): RenderResult {
    return render(
      <Provider store={store}>
        <SamplesListGallery onCardClick={onCardClicked} storageType={'persistent'} />
      </Provider>,
    );
  }

  it('should render cards with v2 metadata only', () => {
    // eslint-disable-next-line
    const store = createFakeStoreWithMetadata();
    renderGallery(store);

    const cards = screen.getAllByRole('article');
    // only one link is with devfile v2 format
    expect(cards.length).toEqual(18);
  });

  it('should handle "onCardClick" event for v2 metadata', async () => {
    let resolveFn: {
      (value?: unknown): void;
    };
    const onCardClicked = jest.fn(() => resolveFn());

    // eslint-disable-next-line
    const store = createFakeStoreWithMetadata();
    renderGallery(store, onCardClicked);

    (mockAxios.get as any).mockResolvedValueOnce({
      data: {},
    });
    const windowSpy = spyOn(window, 'open');
    const cardHeader = screen.getByText('Java with Spring Boot and MongoDB');
    fireEvent.click(cardHeader);
    jest.runOnlyPendingTimers();
    expect(windowSpy).toBeCalledWith(
      'http://localhost/#/load-factory?url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-guestbook%2Ftree%2Fdevfilev2',
      '_blank',
    );
  });

  it('should render empty state', () => {
    // eslint-disable-next-line
    const store = createFakeStoreWithoutMetadata();
    renderGallery(store);

    const emptyStateTitle = screen.getByRole('heading', { name: 'No results found' });
    expect(emptyStateTitle).toBeTruthy();
  });
});

function createFakeStore(metadata?: che.DevfileMetaData[]): Store {
  const registries = {} as {
    [location: string]: {
      metadata?: che.DevfileMetaData[];
      error?: string;
    };
  };
  if (metadata) {
    registries['registry-location'] = {
      metadata,
    };
  }
  return new FakeStoreBuilder()
    .withBranding({
      docs: {
        storageTypes: 'https://docs.location',
      },
    } as BrandingData)
    .withFactoryResolver({
      resolver: {
        source: 'devfile.yaml',
        devfile: {} as devfileApi.Devfile,
        location: 'http://fake-location',
        scm_info: {
          clone_url: 'http://github.com/clone-url',
          scm_provider: 'github',
        },
        links: [],
      },
      converted: {
        isConverted: false,
      } as ConvertedState,
    })
    .withDevfileRegistries({ registries })
    .build();
}

function createFakeStoreWithoutMetadata(): Store {
  return createFakeStore();
}

function createFakeStoreWithMetadata(): Store {
  return createFakeStore(mockMetadata);
}
