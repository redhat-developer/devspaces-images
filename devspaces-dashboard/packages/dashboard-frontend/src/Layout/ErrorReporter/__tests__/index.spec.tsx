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
import { render, screen } from '@testing-library/react';
import { ErrorReporter } from '..';
import { BrandingData } from '../../../services/bootstrap/branding.constant';
import { Issue } from '../../../services/bootstrap/issuesReporter';
import { IssueComponent } from '../Issue';

const brandingData = {
  name: 'Product Name',
} as BrandingData;
const issue = {
  type: 'unknown',
  error: new Error('An Error Message'),
} as Issue;
const component = (
  <ErrorReporter>
    <IssueComponent branding={brandingData} issue={issue} />
  </ErrorReporter>
);

describe('ErrorReporter component', () => {
  it('should correctly render the reported issue', () => {
    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should have the error message', () => {
    render(component);
    expect(screen.queryByText(issue.error.message)).toBeTruthy();
  });
});
