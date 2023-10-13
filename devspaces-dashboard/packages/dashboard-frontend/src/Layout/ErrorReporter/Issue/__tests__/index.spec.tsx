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

import { BrandingData } from '@/services/bootstrap/branding.constant';
import { Issue } from '@/services/bootstrap/issuesReporter';

import { IssueComponent } from '..';

const brandingData = {
  name: 'Product Name',
} as BrandingData;

describe('Issue component', () => {
  it('should render the SSO error', () => {
    const issue = {
      type: 'sso',
      error: new Error('SSO Error Message'),
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the workspaceInactive error', () => {
    const issue = {
      type: 'workspaceInactive',
      error: new Error('The workspace is inactive.'),
      data: { ideLoaderPath: '', workspaceDetailsPath: '' },
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the workspaceInactive error with timeout with seconds', () => {
    const issue = {
      type: 'workspaceInactive',
      error: new Error('The workspace is inactive.'),
      data: { ideLoaderPath: '', workspaceDetailsPath: '', timeout: 40 },
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the workspaceInactive error with timeout with minutes', () => {
    const issue = {
      type: 'workspaceInactive',
      error: new Error('The workspace is inactive.'),
      data: { ideLoaderPath: '', workspaceDetailsPath: '', timeout: 300 },
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the workspaceInactive error with timeout with minutes and seconds', () => {
    const issue = {
      type: 'workspaceInactive',
      error: new Error('The workspace is inactive.'),
      data: { ideLoaderPath: '', workspaceDetailsPath: '', timeout: 320 },
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the workspaceRunTimeout error', () => {
    const issue = {
      type: 'workspaceRunTimeout',
      error: new Error('workspaceRunTimeout error message'),
      data: { ideLoaderPath: '', workspaceDetailsPath: '' },
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the workspaceRunTimeout error with timeout with seconds', () => {
    const issue = {
      type: 'workspaceRunTimeout',
      error: new Error('workspaceRunTimeout error message'),
      data: { ideLoaderPath: '', workspaceDetailsPath: '', timeout: 40 },
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the workspaceRunTimeout error with timeout with minutes', () => {
    const issue = {
      type: 'workspaceRunTimeout',
      error: new Error('workspaceRunTimeout error message'),
      data: { ideLoaderPath: '', workspaceDetailsPath: '', timeout: 300 },
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the workspaceRunTimeout error with timeout with minutes and seconds', () => {
    const issue = {
      type: 'workspaceRunTimeout',
      error: new Error('workspaceRunTimeout error message'),
      data: { ideLoaderPath: '', workspaceDetailsPath: '', timeout: 320 },
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the workspaceStoppedError error', () => {
    const issue = {
      type: 'workspaceStoppedError',
      error: new Error('workspaceStoppedError error message'),
      data: { ideLoaderPath: '', workspaceDetailsPath: '' },
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render the workspaceStopped error', () => {
    const issue = {
      type: 'workspaceStopped',
      error: new Error('workspaceStopped error message'),
      data: { ideLoaderPath: '', workspaceDetailsPath: '' },
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });

  it('should render an unknown error', () => {
    const issue = {
      type: 'unknown',
      error: new Error('Unknown Error Message'),
    } as Issue;
    const component = <IssueComponent branding={brandingData} issue={issue} />;

    expect(renderer.create(component).toJSON()).toMatchSnapshot();
  });
});
