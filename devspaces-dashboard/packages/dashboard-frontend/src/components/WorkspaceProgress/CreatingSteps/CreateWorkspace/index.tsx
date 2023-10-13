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

import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import {
  buildFactoryParams,
  FactoryParams,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { AlertItem } from '@/services/helpers/types';

export type Props = ProgressStepProps & {
  searchParams: URLSearchParams;
};
export type State = ProgressStepState & {
  factoryParams: FactoryParams;
};

export default class CreatingStepCreateWorkspace extends ProgressStep<Props, State> {
  protected readonly name = 'Creating a workspace';

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      name: this.name,
    };
  }

  public componentDidMount() {
    this.prepareAndRun();
  }

  protected async runStep(): Promise<boolean> {
    return true;
  }

  protected buildAlertItem(): AlertItem {
    // should not be called
    throw new Error('Method not implemented.');
  }

  render(): React.ReactElement {
    const { distance, hasChildren } = this.props;
    const { name } = this.state;

    const isError = false;
    const isWarning = false;

    return (
      <React.Fragment>
        <ProgressStepTitle
          distance={distance}
          hasChildren={hasChildren}
          isError={isError}
          isWarning={isWarning}
        >
          {name}
        </ProgressStepTitle>
      </React.Fragment>
    );
  }
}
