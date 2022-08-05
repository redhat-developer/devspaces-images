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

import { List, LoaderStep, LoadingStep } from './index';

export function getWorkspaceLoadingSteps(): LoadingStep[] {
  return [LoadingStep.INITIALIZE, LoadingStep.START_WORKSPACE, LoadingStep.OPEN_WORKSPACE];
}

export type FactorySource = 'devworkspace' | 'devfile';
export function getFactoryLoadingSteps(source: FactorySource): LoadingStep[] {
  return [
    LoadingStep.INITIALIZE,
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
      LoadingStep.CREATE_WORKSPACE__APPLY_DEVFILE,
    ];
  } else {
    return [
      LoadingStep.CREATE_WORKSPACE__FETCH_RESOURCES,
      LoadingStep.CREATE_WORKSPACE__APPLY_RESOURCES,
    ];
  }
}

export function buildLoaderSteps(loadingSteps: LoadingStep[]): List<LoaderStep> {
  const stepsList = new List<LoaderStep>();
  loadingSteps.forEach(step => {
    const parentStep =
      step === LoadingStep.CREATE_WORKSPACE__FETCH_DEVFILE ||
      step === LoadingStep.CREATE_WORKSPACE__FETCH_RESOURCES ||
      step === LoadingStep.CREATE_WORKSPACE__APPLY_DEVFILE ||
      step === LoadingStep.CREATE_WORKSPACE__APPLY_RESOURCES
        ? LoadingStep.CREATE_WORKSPACE
        : undefined;
    stepsList.add(new LoaderStep(step, parentStep));
  });
  return stepsList;
}
