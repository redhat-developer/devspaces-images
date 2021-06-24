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
import renderer from 'react-test-renderer';
import { IssueComponent } from '../';
import { BrandingData } from '../../../../services/bootstrap/branding.constant';
import { Issue } from '../../../../services/bootstrap/issuesReporter';

const brandingData = {
  name: 'Product Name',
  docs: {
    certificate: 'certificate/troubleshooting/location',
  },
} as BrandingData;

describe('Issue component', () => {

  it('should render the certification error', () => {
    const issue = {
      type: 'cert',
      error: new Error('Certificate Error Message'),
    } as Issue;
    const component = (<IssueComponent branding={brandingData} issue={issue} />);

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the SSO error', () => {
    const issue = {
      type: 'sso',
      error: new Error('SSO Error Message'),
    } as Issue;
    const component = (<IssueComponent branding={brandingData} issue={issue} />);

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render an unknown error', () => {
    const issue = {
      type: 'unknown',
      error: new Error('Unknown Error Message'),
    } as Issue;
    const component = (<IssueComponent branding={brandingData} issue={issue} />);

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

});
