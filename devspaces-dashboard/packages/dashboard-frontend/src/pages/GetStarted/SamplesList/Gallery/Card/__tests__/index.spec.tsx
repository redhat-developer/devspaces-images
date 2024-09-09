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

import userEvent from '@testing-library/user-event';
import React from 'react';

import { SampleCard } from '@/pages/GetStarted/SamplesList/Gallery/Card';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';
import { DevfileRegistryMetadata } from '@/store/DevfileRegistries/selectors';

const onCardClick = jest.fn();

const { createSnapshot, renderComponent } = getComponentRenderer(getComponent);

describe('Devfile Metadata Card', () => {
  let metadata: DevfileRegistryMetadata;

  beforeEach(() => {
    metadata = {
      displayName: 'Go',
      description: 'Stack with Go 1.12.10',
      tags: ['Debian', 'Go'],
      icon: '/images/go.svg',
      globalMemoryLimit: '1686Mi',
      links: {
        v2: '/devfiles/go/devfile.yaml',
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('snapshot', () => {
    const snapshot = createSnapshot(metadata);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  it('should have a correct title in header', () => {
    renderComponent(metadata);
    const cardHeader = screen.getByText(metadata.displayName);
    expect(cardHeader).toBeTruthy();
  });

  it('should have an icon', () => {
    renderComponent(metadata);
    const cardIcon = screen.queryByTestId('sample-card-icon');
    expect(cardIcon).toBeTruthy();
  });

  it('should be able to provide the default icon', () => {
    metadata.icon = '';
    renderComponent(metadata);

    const sampleIcon = screen.queryByTestId('sample-card-icon');
    expect(sampleIcon).toBeFalsy();

    const blankIcon = screen.getByTestId('default-card-icon');
    expect(blankIcon).toBeTruthy();
  });

  it('should not have visible tags', () => {
    metadata.tags = ['Debian', 'Go'];
    renderComponent(metadata);

    const badge = screen.queryAllByTestId('card-badge');
    expect(badge.length).toEqual(0);
  });

  it('should have "Community" tag', () => {
    metadata.tags = ['Community', 'Debian', 'Go'];
    renderComponent(metadata);

    const badge = screen.queryAllByTestId('card-badge');
    expect(badge.length).toEqual(1);
    expect(screen.queryByText('Community')).toBeTruthy();
  });

  it('should have "tech-preview" tag', () => {
    metadata.tags = ['Tech-Preview', 'Debian', 'Go'];
    renderComponent(metadata);

    const badge = screen.queryAllByTestId('card-badge');
    expect(badge.length).toEqual(1);
    expect(screen.queryByText('Tech-Preview')).toBeTruthy();
  });

  it('should handle card click', async () => {
    renderComponent(metadata);

    const card = screen.getByRole('article');
    await userEvent.click(card);

    expect(onCardClick).toHaveBeenCalledWith();
  });
});

function getComponent(metadata: DevfileRegistryMetadata): React.ReactElement {
  return <SampleCard key={metadata.links.self} metadata={metadata} onClick={onCardClick} />;
}
