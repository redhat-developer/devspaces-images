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
import { render, RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceInlineAlerts } from '..';
import {
  constructWorkspace,
  Workspace,
  WorkspaceAdapter,
} from '../../../../services/workspace-adapter';
import { DevWorkspaceBuilder } from '../../../../store/__mocks__/devWorkspaceBuilder';
import { CheWorkspaceBuilder } from '../../../../store/__mocks__/cheWorkspaceBuilder';

const mockOnCloseConversionError = jest.fn();
const mockOnCloseRestartAlert = jest.fn();

describe('Inline alerts', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render empty alert group', () => {
    const workspace = constructWorkspace(
      new DevWorkspaceBuilder().withName('wksp').withNamespace('user').build(),
    );
    renderComponent({ workspace });

    const alertHeadings = screen.queryAllByRole('heading');
    expect(alertHeadings.length).toEqual(0);
  });

  it('should render the deprecation warning', () => {
    const deprecatedId = 'wksp-id';
    WorkspaceAdapter.setDeprecatedIds([deprecatedId]);
    const workspace = constructWorkspace(
      new CheWorkspaceBuilder().withId(deprecatedId).withName('wksp').withNamespace('user').build(),
    );
    renderComponent({ workspace });

    const alertHeading = screen.queryByRole('heading');
    expect(alertHeading).toBeTruthy();
    expect(alertHeading).toBeInTheDocument();
    expect(alertHeading).toHaveTextContent('This workspace is deprecated.');
  });

  it('should render the conversion error', () => {
    const deprecatedId = 'wksp-id';
    WorkspaceAdapter.setDeprecatedIds([deprecatedId]);
    const workspace = constructWorkspace(
      new CheWorkspaceBuilder().withId(deprecatedId).withName('wksp').withNamespace('user').build(),
    );
    const conversionError = 'An error happened during devfiles conversion.';
    renderComponent({ workspace, conversionError });

    const alertHeading = screen.queryByRole('heading', {
      name: /workspace conversion failed/i,
    });
    expect(alertHeading).toBeTruthy();
    expect(alertHeading).toBeInTheDocument();
    expect(screen.queryByText(conversionError)).toBeTruthy();
    expect(screen.queryByText(/instructions for converting/i)).toBeTruthy();
  });

  it('should render the restart warning', () => {
    const workspace = constructWorkspace(
      new DevWorkspaceBuilder().withName('wksp').withNamespace('user').build(),
    );
    renderComponent({ workspace, restartWarning: true });

    const alertHeading = screen.queryByRole('heading');
    expect(alertHeading).toBeTruthy();
    expect(alertHeading).toBeInTheDocument();
    expect(alertHeading).toHaveTextContent(/should be restarted to apply changes/i);
  });

  describe('workspace failures', () => {
    it('should render no alerts if status message was not set', () => {
      const workspace = constructWorkspace(
        new DevWorkspaceBuilder()
          .withName('wksp')
          .withNamespace('user')
          .withStatus({ phase: 'FAILED' })
          .build(),
      );
      renderComponent({ workspace });

      const alertHeading = screen.queryByRole('heading');
      expect(alertHeading).toBeFalsy();
    });

    it('should initially render a failure error', () => {
      const failureMessage = 'The workspace failed to start.';
      const workspace = constructWorkspace(
        new DevWorkspaceBuilder()
          .withName('wksp')
          .withNamespace('user')
          .withStatus({ phase: 'FAILED', message: failureMessage })
          .build(),
      );
      renderComponent({ workspace });

      const alertHeading = screen.queryByRole('heading');
      expect(alertHeading).toBeTruthy();
      expect(alertHeading).toBeInTheDocument();
      expect(alertHeading).toHaveTextContent(failureMessage);
    });

    it('should re-render a failure error', () => {
      const failureMessage = 'The workspace failed to start.';
      const initWorkspace = constructWorkspace(
        new DevWorkspaceBuilder()
          .withName('wksp')
          .withNamespace('user')
          .withStatus({ phase: 'FAILED' })
          .build(),
      );
      const { rerender } = renderComponent({ workspace: initWorkspace });

      const prevAlertHeading = screen.queryByRole('heading');
      expect(prevAlertHeading).toBeFalsy();

      const nextWorkspace = constructWorkspace(
        new DevWorkspaceBuilder()
          .withName('wksp')
          .withNamespace('user')
          .withStatus({ phase: 'FAILED', message: failureMessage })
          .build(),
      );
      reRenderComponent({ workspace: nextWorkspace }, rerender);

      const nextAlertHeading = screen.queryByRole('heading');
      expect(nextAlertHeading).toBeTruthy();
      expect(nextAlertHeading).toBeInTheDocument();
      expect(nextAlertHeading).toHaveTextContent(failureMessage);
    });

    // the alert should remain closed if until the workspace status is changed
    it('should close a failure error', () => {
      const failureMessage = 'The workspace failed to start.';
      const devworkspace = new DevWorkspaceBuilder()
        .withName('wksp')
        .withNamespace('user')
        .withStatus({ phase: 'FAILED', message: failureMessage })
        .build();
      const prevWorkspace = constructWorkspace(devworkspace);
      const { rerender } = renderComponent({ workspace: prevWorkspace });

      // alert visible
      let prevAlertHeading = screen.queryByRole('heading');
      expect(prevAlertHeading).toBeTruthy();

      const closeButton = screen.getByRole('button', {
        name: /workspace failed/i,
      });
      userEvent.click(closeButton);

      // alert closed
      prevAlertHeading = screen.queryByRole('heading');
      expect(prevAlertHeading).toBeFalsy();

      const nextWorkspace = constructWorkspace(devworkspace);
      reRenderComponent({ workspace: nextWorkspace }, rerender);

      // alert remains closed
      const nextAlertHeading = screen.queryByRole('heading');
      expect(nextAlertHeading).toBeFalsy();
    });

    // the alert should be reopened if the workspace status is changed
    it('should reopen a failure error alert', () => {
      const failureMessage = 'The workspace failed to start.';
      const failedWorkspace = constructWorkspace(
        new DevWorkspaceBuilder()
          .withName('wksp')
          .withNamespace('user')
          .withStatus({ phase: 'FAILED', message: failureMessage })
          .build(),
      );
      const startingWorkspace = constructWorkspace(
        new DevWorkspaceBuilder()
          .withName('wksp')
          .withNamespace('user')
          .withStatus({ phase: 'STARTING' })
          .build(),
      );

      const { rerender } = renderComponent({ workspace: failedWorkspace });

      // alert visible
      let prevAlertHeading = screen.queryByRole('heading');
      expect(prevAlertHeading).toBeTruthy();

      const closeButton = screen.getByRole('button', {
        name: /workspace failed/i,
      });
      userEvent.click(closeButton);

      // alert closed
      prevAlertHeading = screen.queryByRole('heading');
      expect(prevAlertHeading).toBeFalsy();

      // render the workspace in 'starting' phase
      reRenderComponent({ workspace: startingWorkspace }, rerender);

      // render the workspace in 'failed' phase again
      reRenderComponent({ workspace: failedWorkspace }, rerender);

      // alert should be visible
      const nextAlertHeading = screen.queryByRole('heading');
      expect(nextAlertHeading).toBeTruthy();
    });
  });
});

function renderComponent(options: {
  workspace: Workspace;
  conversionError?: string;
  restartWarning?: boolean;
}): RenderResult {
  options.restartWarning = !!options.restartWarning;

  return render(
    <WorkspaceInlineAlerts
      workspace={options.workspace}
      conversionError={options.conversionError}
      showRestartWarning={options.restartWarning}
      onCloseConversionAlert={mockOnCloseConversionError}
      onCloseRestartAlert={mockOnCloseRestartAlert}
    />,
  );
}
function reRenderComponent(
  options: {
    workspace: Workspace;
    conversionError?: string;
    restartWarning?: boolean;
  },
  rerender: (ui: React.ReactElement) => void,
): void {
  options.restartWarning = !!options.restartWarning;

  rerender(
    <WorkspaceInlineAlerts
      workspace={options.workspace}
      conversionError={options.conversionError}
      showRestartWarning={options.restartWarning}
      onCloseConversionAlert={mockOnCloseConversionError}
      onCloseRestartAlert={mockOnCloseRestartAlert}
    />,
  );
}
