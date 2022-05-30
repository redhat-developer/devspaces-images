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
import { WizardStep } from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationCircleIcon, InProgressIcon } from '@patternfly/react-icons';

import workspaceStatusLabelStyles from '../../WorkspaceStatusLabel/index.module.css';
import styles from './index.module.css';

export enum IdeLoaderSteps {
  INITIALIZING = 1,
  START_WORKSPACE,
  OPEN_IDE,
}

function getStepTitle(id: IdeLoaderSteps): string {
  switch (id) {
    case IdeLoaderSteps.INITIALIZING:
      return 'Initializing';
    case IdeLoaderSteps.START_WORKSPACE:
      return 'Waiting for workspace to start';
    case IdeLoaderSteps.OPEN_IDE:
      return 'Open IDE';
  }
}

export class LoaderStep {
  private _id: number;
  private _title: string;
  public hasError: boolean;

  constructor(id: number, hasError = false) {
    this._id = id;
    this._title = getStepTitle(id);
    this.hasError = hasError;
  }

  get id(): IdeLoaderSteps {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  private buildIcon(currentStepId: number): React.ReactNode {
    if (currentStepId < this.id) {
      return '';
    }

    if (currentStepId > this.id) {
      return (
        <CheckCircleIcon data-testid="step-done-icon" className={styles.stepIcon} color="green" />
      );
    }

    if (this.hasError) {
      return (
        <ExclamationCircleIcon
          data-testid="step-failed-icon"
          className={styles.stepIcon}
          color="red"
        />
      );
    } else {
      return (
        <InProgressIcon
          data-testid="step-in-progress-icon"
          className={`${workspaceStatusLabelStyles.rotate} ${styles.stepIcon}`}
          color="#0e6fe0"
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

  public toWizardStep(currentStepId: number): WizardStep {
    const icon = this.buildIcon(currentStepId);
    return {
      id: this.id,
      name: this.buildName(currentStepId, icon),
      canJumpTo: currentStepId >= this.id,
    };
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
    return this.nextIndex <= this.list.size;
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
}
