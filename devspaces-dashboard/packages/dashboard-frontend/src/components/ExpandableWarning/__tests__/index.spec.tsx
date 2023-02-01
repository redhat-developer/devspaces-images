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
import renderer from 'react-test-renderer';

import ExpandableWarningItems, { ERROR_MESSAGE_ID } from '../';
import { render, RenderResult, screen } from '@testing-library/react';

describe('Expandable warning items', () => {
  it('should correctly render the component', () => {
    const component = getComponent(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi non sollicitudin lorem, a suscipit massa. Cras egestas ante vel est pulvinar, a elementum orci faucibus. Etiam in risus et augue sollicitudin facilisis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Vivamus ligula arcu, imperdiet hendrerit nulla varius, molestie volutpat nunc.',
      'Ut venenatis, purus ut ultrices luctus, nisi leo rutrum tortor, id sagittis nisl augue ac risus. In hac habitasse platea dictumst. Curabitur vitae dui eu elit egestas consectetur ac sed lacus. Nam nisl arcu, mollis eget tempor consequat, egestas nec lacus. Sed elementum, nibh id suscipit accumsan, metus mauris ultrices nisi, ut gravida sapien ipsum at elit. Maecenas in ultrices ex, id efficitur ante. Nulla facilisi.',
      'Sed iaculis dictum nibh nec varius. Pellentesque ac diam vestibulum nisl condimentum feugiat. Sed et est in dolor posuere pharetra. Aliquam sodales lorem eu velit efficitur vestibulum. Praesent ornare ut tellus nec cursus. Proin at hendrerit metus, sed placerat justo. Cras id hendrerit ante, et consequat orci. Ut ante ipsum, eleifend sit amet iaculis quis, scelerisque eget mi. Pellentesque aliquam porttitor neque ut consectetur. Vivamus euismod elit velit, eget suscipit sem euismod vitae. Quisque sagittis, felis ut rhoncus vestibulum, arcu dui tincidunt quam, sit amet congue ligula dolor id sapien.',
    );
    const json = renderer.create(component).toJSON();

    expect(json).toMatchSnapshot();
  });

  it('should show a short error message and an expand button', () => {
    const component = getComponent(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi non sollicitudin lorem, a suscipit massa. Cras egestas ante vel est pulvinar, a elementum orci faucibus. Etiam in risus et augue sollicitudin facilisis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Vivamus ligula arcu, imperdiet hendrerit nulla varius, molestie volutpat nunc.',
      'Ut venenatis, purus ut ultrices luctus, nisi leo rutrum tortor, id sagittis nisl augue ac risus. In hac habitasse platea dictumst. Curabitur vitae dui eu elit egestas consectetur ac sed lacus. Nam nisl arcu, mollis eget tempor consequat, egestas nec lacus. Sed elementum, nibh id suscipit accumsan, metus mauris ultrices nisi, ut gravida sapien ipsum at elit. Maecenas in ultrices ex, id efficitur ante. Nulla facilisi.',
      'Sed iaculis dictum nibh nec varius. Pellentesque ac diam vestibulum nisl condimentum feugiat. Sed et est in dolor posuere pharetra. Aliquam sodales lorem eu velit efficitur vestibulum. Praesent ornare ut tellus nec cursus. Proin at hendrerit metus, sed placerat justo. Cras id hendrerit ante, et consequat orci. Ut ante ipsum, eleifend sit amet iaculis quis, scelerisque eget mi. Pellentesque aliquam porttitor neque ut consectetur. Vivamus euismod elit velit, eget suscipit sem euismod vitae. Quisque sagittis, felis ut rhoncus vestibulum, arcu dui tincidunt quam, sit amet congue ligula dolor id sapien.',
    );

    renderComponent(component);

    expect(screen.queryByTestId(ERROR_MESSAGE_ID)).toBeTruthy;
    expect(screen.getByTestId(ERROR_MESSAGE_ID).className).toEqual('hideOverflow');
    expect(screen.queryByText('Show More')).toBeTruthy;
  });
});

function getComponent(
  textBefore: string,
  errorMessage: string,
  textAfter: string,
): React.ReactElement {
  return (
    <ExpandableWarningItems
      textBefore={textBefore}
      errorMessage={errorMessage}
      textAfter={textAfter}
    />
  );
}

function renderComponent(component: React.ReactElement): RenderResult {
  return render(component);
}
