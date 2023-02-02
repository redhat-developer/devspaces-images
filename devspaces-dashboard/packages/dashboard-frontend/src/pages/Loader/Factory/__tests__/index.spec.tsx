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
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FactoryLoaderPage } from '..';
import { LoadingStep, List, LoaderStep } from '../../../../components/Loader/Step';
import {
  buildLoaderSteps,
  getFactoryLoadingSteps,
} from '../../../../components/Loader/Step/buildSteps';
import { AlertItem, LoaderTab } from '../../../../services/helpers/types';
import getComponentRenderer from '../../../../services/__mocks__/getComponentRenderer';

jest.mock('react-tooltip', () => {
  return function DummyTooltip(): React.ReactElement {
    return <div>Dummy Tooltip</div>;
  };
});
jest.mock('../../../../components/Loader/Alert');
jest.mock('../../../../components/Loader/Progress');
jest.mock('../../../../components/WorkspaceLogs');
jest.mock('../../Common');

const { renderComponent } = getComponentRenderer(getComponent);

const currentStepId = LoadingStep.INITIALIZE;

describe('Factory Loader page', () => {
  let steps: List<LoaderStep>;

  beforeEach(() => {
    const loadingSteps = getFactoryLoadingSteps('devfile');
    steps = buildLoaderSteps(loadingSteps);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle tab change', () => {
    renderComponent({ steps: steps.values, initialTab: 'Progress' });

    const activeTab = screen.queryByTestId('active-tab-key');
    expect(activeTab?.textContent).toEqual(LoaderTab.Progress.toString());

    const logsTabButton = screen.getByRole('button', { name: 'Logs' });
    userEvent.click(logsTabButton);

    expect(activeTab?.textContent).toEqual(LoaderTab.Logs.toString());
  });
});

function getComponent(props: {
  steps: LoaderStep[];
  initialTab?: keyof typeof LoaderTab;
  alertItem?: AlertItem;
}): React.ReactElement {
  return (
    <FactoryLoaderPage
      alertItem={props.alertItem}
      currentStepId={currentStepId}
      steps={props.steps}
      tabParam={'Progress'}
      workspace={undefined}
    />
  );
}
