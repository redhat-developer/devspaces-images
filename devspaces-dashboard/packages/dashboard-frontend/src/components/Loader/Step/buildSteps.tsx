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

import { List, LoaderStep, LoadingStep } from './index';

export function getWorkspaceLoadingSteps(): LoadingStep[] {
  return [
    LoadingStep.INITIALIZE,
    LoadingStep.CHECK_RUNNING_WORKSPACES_LIMIT,
    LoadingStep.START_WORKSPACE,
    LoadingStep.OPEN_WORKSPACE,
  ];
}

export type FactorySource = 'devworkspace' | 'devfile';
export function getFactoryLoadingSteps(source: FactorySource): LoadingStep[] {
  return [
    LoadingStep.INITIALIZE,
    LoadingStep.CHECK_RUNNING_WORKSPACES_LIMIT,
    LoadingStep.CREATE_WORKSPACE,
    ...getResourcesFetchingSteps(source),
    LoadingStep.START_WORKSPACE,
    LoadingStep.OPEN_WORKSPACE,
  ];
}

export function getResourcesFetchingSteps(source: FactorySource): LoadingStep[] {
  if (source === 'devfile') {
    return [
      LoadingStep.CREATE_WORKSPACE__FETCH_DEVFILE,
      LoadingStep.CREATE_WORKSPACE__CHECK_EXISTING_WORKSPACES,
      LoadingStep.CREATE_WORKSPACE__APPLY_DEVFILE,
    ];
  } else {
    return [
      LoadingStep.CREATE_WORKSPACE__FETCH_RESOURCES,
      LoadingStep.CREATE_WORKSPACE__CHECK_EXISTING_WORKSPACES,
      LoadingStep.CREATE_WORKSPACE__APPLY_RESOURCES,
    ];
  }
}

export function buildLoaderSteps(loadingSteps: LoadingStep[]): List<LoaderStep> {
  const stepsList = new List<LoaderStep>();
  loadingSteps.forEach(step => {
    let parentStep: LoadingStep | undefined;
    switch (step) {
      case LoadingStep.CREATE_WORKSPACE__FETCH_DEVFILE:
      case LoadingStep.CREATE_WORKSPACE__FETCH_RESOURCES:
      case LoadingStep.CREATE_WORKSPACE__APPLY_DEVFILE:
      case LoadingStep.CREATE_WORKSPACE__APPLY_RESOURCES:
      case LoadingStep.CREATE_WORKSPACE__CHECK_EXISTING_WORKSPACES:
        parentStep = LoadingStep.CREATE_WORKSPACE;
        break;
      case LoadingStep.CHECK_RUNNING_WORKSPACES_LIMIT:
        parentStep = LoadingStep.INITIALIZE;
        break;
      default:
        parentStep = undefined;
    }
    stepsList.add(new LoaderStep(step, parentStep));
  });
  return stepsList;
}
