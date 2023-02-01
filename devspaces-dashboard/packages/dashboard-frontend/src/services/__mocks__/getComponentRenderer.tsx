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
import { render } from '@testing-library/react';
import renderer from 'react-test-renderer';

export default function <T extends Array<unknown>>(
  getComponent: (..._args: T) => React.ReactElement,
): {
  createSnapshot: (...args: T) => renderer.ReactTestRenderer;
  renderComponent: (...args: T) => {
    reRenderComponent: (..._args: T) => void;
  };
} {
  return {
    createSnapshot: (...args: T) => {
      return renderer.create(getComponent(...args));
    },
    renderComponent: (...args: T) => {
      const res = render(getComponent(...args));
      return {
        reRenderComponent: (..._args: T) => {
          res.rerender(getComponent(..._args));
        },
      };
    },
  };
}
