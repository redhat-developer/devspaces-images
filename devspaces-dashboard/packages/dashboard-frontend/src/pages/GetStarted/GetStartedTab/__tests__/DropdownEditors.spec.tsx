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

import { Dropdown, KebabToggle } from '@patternfly/react-core';
import { fireEvent, render, RenderResult, screen, within } from '@testing-library/react';
import React from 'react';

import DropdownEditors from '@/pages/GetStarted/GetStartedTab/DropdownEditors';
import { TargetEditor } from '@/pages/GetStarted/GetStartedTab/SamplesListGallery';

const onItemClick = jest.fn();

describe('DropdownEditors component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have editor items', () => {
    const editors: TargetEditor[] = [
      {
        id: 'che-incubator/che-code/insiders',
        name: 'che-code',
        tooltip: 'Code OSS integration in Eclipse Che.',
        version: 'insiders',
        isDefault: true,
      },
      {
        id: 'eclipse/che-theia/next',
        name: 'theia-ide',
        tooltip: 'Eclipse Theia.',
        version: 'next',
        isDefault: false,
      },
    ];

    const component = (
      <Dropdown
        isOpen={true}
        toggle={<KebabToggle />}
        dropdownItems={[
          <DropdownEditors key="test" onClick={onItemClick} targetEditors={editors} />,
        ]}
      />
    );
    renderComponent(component);

    const menuitems = screen.getAllByRole('menuitem');

    expect(menuitems.length).toEqual(2);

    const codeItem = menuitems[0];
    expect(codeItem.textContent).toContain('che-code');

    const codeItemCheckMark = within(codeItem).queryByTestId('checkmark');
    expect(codeItemCheckMark).not.toBeNull();

    const theiaItem = menuitems[1];
    expect(theiaItem.textContent).toContain('theia-ide');

    const theiaItemCheckMark = within(theiaItem).queryByTestId('checkmark');
    expect(theiaItemCheckMark).toBeNull();
  });

  it('should handle "onClick" events', () => {
    const editors: TargetEditor[] = [
      {
        id: 'che-incubator/che-code/insiders',
        name: 'che-code',
        tooltip: 'Code OSS integration in Eclipse Che.',
        version: 'insiders',
        isDefault: true,
      },
      {
        id: 'eclipse/che-theia/next',
        name: 'theia-ide',
        tooltip: 'Eclipse Theia.',
        version: 'next',
        isDefault: false,
      },
    ];

    const component = (
      <Dropdown
        isOpen={true}
        toggle={<KebabToggle />}
        dropdownItems={[
          <DropdownEditors key="test" onClick={onItemClick} targetEditors={editors} />,
        ]}
      />
    );
    renderComponent(component);

    const theiaItem = screen.getByText('theia-ide');
    fireEvent.click(theiaItem);

    expect(onItemClick).toHaveBeenCalledWith('eclipse/che-theia/next');

    const codeItem = screen.getByText('che-code');
    fireEvent.click(codeItem);

    expect(onItemClick).toHaveBeenCalledWith('che-incubator/che-code/insiders');
  });
});

function renderComponent(component: React.ReactElement): RenderResult {
  return render(component);
}
