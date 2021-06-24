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
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import { Store } from 'redux';
import { Provider } from 'react-redux';
import FactoryLoaderTabs from '../';
import { LoadFactorySteps } from '../../../containers/FactoryLoader';
import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { createFakeCheWorkspace } from '../../../store/__mocks__/workspace';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return (<div>Dummy Tooltip</div>);
  };
});

const workspaceName = 'wksp-test';
const workspaceId = 'testWorkspaceId';
const workspace = createFakeCheWorkspace(workspaceId, workspaceName);
const store = new FakeStoreBuilder().withCheWorkspaces({
  workspaces: [workspace],
}).build();

describe('The Factory Loader page  component', () => {

  it('should render INITIALIZING step correctly', () => {
    const currentStep = LoadFactorySteps.INITIALIZING;
    const hasError = false;
    const component = renderComponent(store, currentStep, workspaceName, workspaceId, hasError);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render INITIALIZING step with an error correctly', () => {
    const currentStep = LoadFactorySteps.INITIALIZING;
    const hasError = true;
    const component = renderComponent(store, currentStep, workspaceName, workspaceId, hasError);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render LOOKING_FOR_DEVFILE step with devfile location correctly', () => {
    const currentStep = LoadFactorySteps.LOOKING_FOR_DEVFILE;
    const hasError = false;
    const devfileLocationInfo = '`devfile.yaml`  in github repo https://github.com/test/test.git';
    const component = renderComponent(store, currentStep, workspaceName, workspaceId, hasError, devfileLocationInfo);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render LOOKING_FOR_DEVFILE step without devfile location correctly', () => {
    const currentStep = LoadFactorySteps.LOOKING_FOR_DEVFILE;
    const hasError = false;
    const component = renderComponent(store, currentStep, workspaceName, workspaceId, hasError);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render LOOKING_FOR_DEVFILE step with an error correctly', () => {
    const currentStep = LoadFactorySteps.LOOKING_FOR_DEVFILE;
    const hasError = true;
    const component = renderComponent(store, currentStep, workspaceName, workspaceId, hasError);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render APPLYING_DEVFILE step correctly', () => {
    const currentStep = LoadFactorySteps.APPLYING_DEVFILE;
    const hasError = false;
    const component = renderComponent(store, currentStep, workspaceName, workspaceId, hasError);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render APPLYING_DEVFILE step with an error correctly', () => {
    const currentStep = LoadFactorySteps.APPLYING_DEVFILE;
    const hasError = true;
    const component = renderComponent(store, currentStep, workspaceName, workspaceId, hasError);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render START_WORKSPACE step correctly', () => {
    const currentStep = LoadFactorySteps.START_WORKSPACE;
    const hasError = false;
    const component = renderComponent(store, currentStep, workspaceName, workspaceId, hasError);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render START_WORKSPACE step with an error correctly', () => {
    const currentStep = LoadFactorySteps.START_WORKSPACE;
    const hasError = true;
    const component = renderComponent(store, currentStep, workspaceName, workspaceId, hasError);

    expect(component.toJSON()).toMatchSnapshot();
  });

  it('should render OPEN_IDE step correctly', () => {
    const currentStep = LoadFactorySteps.OPEN_IDE;
    const hasError = false;
    const component = renderComponent(store, currentStep, workspaceName, workspaceId, hasError);

    expect(component.toJSON()).toMatchSnapshot();
  });
});

function renderComponent(
  store: Store,
  currentStep: LoadFactorySteps,
  workspaceName: string,
  workspaceId: string,
  hasError: boolean,
  devfileLocationInfo?: string,
): ReactTestRenderer {
  return renderer.create(
    <Provider store={store}>
      <FactoryLoaderTabs
        currentStep={currentStep}
        workspaceName={workspaceName}
        workspaceId={workspaceId}
        hasError={hasError}
        devfileLocationInfo={devfileLocationInfo}
      />
    </Provider>,
  );
}
