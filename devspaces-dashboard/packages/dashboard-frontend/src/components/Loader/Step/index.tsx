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
import { WizardStep } from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InProgressIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';

import workspaceStatusLabelStyles from '../../WorkspaceStatusLabel/index.module.css';
import styles from './index.module.css';

export enum LoadingStep {
  INITIALIZE = 1,
  CHECK_RUNNING_WORKSPACES_LIMIT,
  CREATE_WORKSPACE,
  CREATE_WORKSPACE__FETCH_DEVFILE,
  CREATE_WORKSPACE__FETCH_RESOURCES,
  CREATE_WORKSPACE__CHECK_EXISTING_WORKSPACES,
  CREATE_WORKSPACE__APPLY_DEVFILE,
  CREATE_WORKSPACE__APPLY_RESOURCES,
  START_WORKSPACE,
  OPEN_WORKSPACE,
}

function getStepTitle(id: LoadingStep): string {
  switch (id) {
    case LoadingStep.INITIALIZE:
      return 'Initializing';
    case LoadingStep.CREATE_WORKSPACE:
      return 'Creating a workspace';
    case LoadingStep.CREATE_WORKSPACE__FETCH_DEVFILE:
      return 'Looking for devfile';
    case LoadingStep.CREATE_WORKSPACE__FETCH_RESOURCES:
      return 'Fetching pre-built resources';
    case LoadingStep.CREATE_WORKSPACE__CHECK_EXISTING_WORKSPACES:
      return 'Checking existing workspaces';
    case LoadingStep.CREATE_WORKSPACE__APPLY_DEVFILE:
      return 'Applying devfile';
    case LoadingStep.CREATE_WORKSPACE__APPLY_RESOURCES:
      return 'Applying resources';
    case LoadingStep.CHECK_RUNNING_WORKSPACES_LIMIT:
      return 'Checking for the limit of running workspaces';
    case LoadingStep.START_WORKSPACE:
      return 'Waiting for workspace to start';
    case LoadingStep.OPEN_WORKSPACE:
      return 'Open IDE';
  }
}

export class LoaderStep {
  private _id: number;
  private _title: string;
  private _parentId: number | undefined;
  public hasError = false;
  public hasWarning = false;

  static toWizardSteps(
    currentStepId: number,
    steps: LoaderStep[],
    parentId?: number,
  ): WizardStep[] {
    return steps
      .filter(step => step.parentId === parentId)
      .map(step => {
        const childrenSteps = LoaderStep.toWizardSteps(currentStepId, steps, step.id);
        return step.toWizardStep(currentStepId, childrenSteps);
      });
  }

  constructor(id: number, parentId?: number) {
    this._id = id;
    this._title = getStepTitle(id);
    this._parentId = parentId;
  }

  get id(): LoadingStep {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  set title(newTitle: string) {
    this._title = newTitle;
  }

  get parentId(): number | undefined {
    return this._parentId;
  }

  private buildIcon(currentStepId: number): React.ReactNode {
    if (this.hasError) {
      return (
        <ExclamationCircleIcon
          data-testid="step-failed-icon"
          className={`${styles.errorIcon} ${styles.stepIcon}`}
        />
      );
    }

    if (this.hasWarning) {
      return (
        <ExclamationTriangleIcon
          data-testid="step-warning-icon"
          className={`${styles.warningIcon} ${styles.stepIcon}`}
        />
      );
    }

    if (currentStepId < this.id) {
      return '';
    } else if (currentStepId > this.id) {
      return (
        <CheckCircleIcon
          data-testid="step-done-icon"
          className={`${styles.successIcon} ${styles.stepIcon}`}
        />
      );
    } else {
      return (
        <InProgressIcon
          data-testid="step-in-progress-icon"
          className={`${styles.inProgressIcon} ${workspaceStatusLabelStyles.rotate} ${styles.stepIcon}`}
        />
      );
    }
  }

  private buildName(currentStepId: number, icon: React.ReactNode): React.ReactNode {
    let className = '';
    if (currentStepId === this.id) {
      className = this.hasError ? styles.error : styles.progress;
    }
    return (
      <React.Fragment>
        {icon}
        <span data-testid="step-title" className={className}>
          {this.title}
        </span>
      </React.Fragment>
    );
  }

  private toWizardStep(currentStepId: number, childrenSteps?: WizardStep[]): WizardStep {
    const icon = this.buildIcon(currentStepId);
    const step: WizardStep = {
      id: this.id,
      name: this.buildName(currentStepId, icon),
      canJumpTo: currentStepId >= this.id,
    };
    if (childrenSteps && childrenSteps.length !== 0) {
      step.steps = childrenSteps;
    }
    return step;
  }
}

export class ListNode<T> {
  private readonly list: List<T>;

  public readonly index: number;
  public readonly value: T;

  constructor(list: List<T>, value: T, index: number) {
    this.list = list;
    this.index = index;
    this.value = value;
  }

  get prev(): ListNode<T> {
    return this.list.get(this.prevIndex);
  }

  get prevIndex(): number {
    return this.index - 1;
  }

  hasPrev(): boolean {
    return this.prevIndex >= 0;
  }

  get next(): ListNode<T> {
    return this.list.get(this.nextIndex);
  }

  get nextIndex(): number {
    return this.index + 1;
  }

  hasNext(): boolean {
    return this.nextIndex < this.list.size;
  }
}

export class List<T> {
  private nodes: Array<ListNode<T>>;

  constructor() {
    this.nodes = [];
  }

  get size(): number {
    return this.nodes.length;
  }

  get values(): Array<T> {
    return this.nodes.map(item => item.value);
  }

  add(value: T): void {
    this.nodes.push(new ListNode<T>(this, value, this.size));
  }

  set(index: number, value: T): void {
    this.nodes[index] = new ListNode<T>(this, value, this.size);
  }

  get(index: number): ListNode<T> {
    return this.nodes[index];
  }

  find(value: T): ListNode<T> | undefined {
    return this.nodes.find(node => node.value === value);
  }
}
