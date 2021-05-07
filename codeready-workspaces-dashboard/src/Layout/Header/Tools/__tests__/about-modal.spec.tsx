/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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
import { AboutModal } from '../about-modal';

jest.mock('detect-browser/index.js', () => {
  return {
    detect: () => {
      return {
        name: 'chrome',
        version: '1.0.0',
        os: 'linux',
        type: 'browser'
      };
    }
  };
});

describe('About modal', () => {

  const closeModal = jest.fn();
  const component = (<AboutModal
    productName="Che"
    productVersion="0.0.1"
    closeAboutModal={closeModal}
    isOpen={true}
    logo="./"
    username="test-user"
  />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // todo react-test-renderer doesn't have support for portal: https://github.com/facebook/react/issues/11565
  // which makes this fail
  // it('should correctly render the component', () => {
  //   expect(renderer.create(component).toJSON()).toMatchSnapshot();
  // });

  it('should display username', () => {
    const { getByText } = render(component);
    expect(getByText('Username')).not.toBeNull();
    expect(getByText('test-user')).not.toBeNull();
  });

  it('should display product version', () => {
    const { getByText } = render(component);
    expect(getByText('Version')).not.toBeNull();
    expect(getByText('0.0.1')).not.toBeNull();
  });

  it('should display browser version', () => {
    const { getByText } = render(component);
    expect(getByText('Browser Version')).not.toBeNull();
    expect(getByText('1.0.0')).not.toBeNull();
  });

  it('should display browser os', () => {
    const { getByText } = render(component);
    expect(getByText('Browser OS')).not.toBeNull();
    expect(getByText(/linux/i)).not.toBeNull();
  });

  it('should display browser name', () => {
    const { getByText } = render(component);
    expect(getByText('Browser Name')).not.toBeNull();
    expect(getByText(/chrome/i)).not.toBeNull();
  });
});
