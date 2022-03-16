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
import { render, screen, RenderResult, fireEvent } from '@testing-library/react';
import { SampleCard } from '../SampleCard';

describe('Devfile Metadata Card', () => {
  const onCardClick = jest.fn();
  let metadata: che.DevfileMetaData;

  beforeEach(() => {
    metadata = {
      displayName: 'Go',
      description: 'Stack with Go 1.12.10',
      tags: ['Debian', 'Go'],
      icon: '/images/go.svg',
      globalMemoryLimit: '1686Mi',
      links: {
        self: '/devfiles/go/devfile.yaml',
      },
    };

    jest.clearAllMocks();
  });

  function renderCard(): RenderResult {
    return render(
      <SampleCard key={metadata.links.self} metadata={metadata} onClick={onCardClick} />,
    );
  }

  it('should have a correct title in header', () => {
    renderCard();
    const cardHeader = screen.getByText(metadata.displayName);
    expect(cardHeader).toBeTruthy();
  });

  it('should have an icon', () => {
    renderCard();
    const cardIcon = screen.queryByAltText(metadata.displayName);
    expect(cardIcon).toBeTruthy();
  });

  it('should be able to provide the default icon', () => {
    metadata.icon = '';
    const { container } = renderCard();

    const cardIcon = screen.queryByAltText(metadata.displayName);
    expect(cardIcon).toBeFalsy();

    const blankIcon = container.querySelector('.codicon-symbol-method');
    expect(blankIcon).toBeTruthy();
  });

  it('should handle "onClick" event', () => {
    renderCard();

    const card = screen.getByRole('article');
    fireEvent.click(card);

    expect(onCardClick).toHaveBeenCalledWith(metadata);
  });

  it('should not have visible tags', () => {
    metadata.tags = ['Debian', 'Go'];
    renderCard();

    const badge = screen.queryAllByTestId('card-badge');
    expect(badge.length).toEqual(0);
  });

  it('should have "community" tag', () => {
    metadata.tags = ['community', 'Debian', 'Go'];
    renderCard();

    const badge = screen.queryAllByTestId('card-badge');
    expect(badge.length).toEqual(1);
    expect(screen.queryByText('community')).toBeTruthy();
  });

  it('should have "tech-preview" tag', () => {
    metadata.tags = ['tech-preview', 'Debian', 'Go'];
    renderCard();

    const badge = screen.queryAllByTestId('card-badge');
    expect(badge.length).toEqual(1);
    expect(screen.queryByText('tech-preview')).toBeTruthy();
  });
});
