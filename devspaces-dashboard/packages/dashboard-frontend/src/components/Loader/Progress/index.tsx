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
import { Wizard, WizardStep } from '@patternfly/react-core';
import { LoadingStep } from '../Step';

import styles from './index.module.css';

export type Props = {
  currentStepId: LoadingStep;
  steps: WizardStep[];
};

export class LoaderProgress extends React.PureComponent<Props> {
  private readonly wizardRef: React.RefObject<any>;

  constructor(props: Props) {
    super(props);

    this.wizardRef = React.createRef();
  }

  render(): React.ReactNode {
    const { currentStepId, steps } = this.props;

    return (
      <Wizard
        className={styles.progress}
        steps={steps}
        footer={<span />}
        height={500}
        startAtStep={currentStepId}
        ref={this.wizardRef}
      />
    );
  }
}
