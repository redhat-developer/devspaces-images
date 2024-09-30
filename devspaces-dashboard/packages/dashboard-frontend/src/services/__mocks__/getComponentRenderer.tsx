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

import { render } from '@testing-library/react';
import React from 'react';
import renderer from 'react-test-renderer';

export * from '@testing-library/react';

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
