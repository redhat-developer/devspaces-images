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

import { helpers } from '@eclipse-che/common';
import { AlertVariant } from '@patternfly/react-core';
import { isEqual } from 'lodash';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { TIMEOUT_TO_CREATE_SEC } from '@/components/WorkspaceProgress/const';
import prepareResources from '@/components/WorkspaceProgress/CreatingSteps/Apply/Resources/prepareResources';
import {
  ProgressStep,
  ProgressStepProps,
  ProgressStepState,
} from '@/components/WorkspaceProgress/ProgressStep';
import { ProgressStepTitle } from '@/components/WorkspaceProgress/StepTitle';
import { TimeLimit } from '@/components/WorkspaceProgress/TimeLimit';
import {
  buildFactoryParams,
  FactoryParams,
} from '@/services/helpers/factoryFlow/buildFactoryParams';
import { findTargetWorkspace } from '@/services/helpers/factoryFlow/findTargetWorkspace';
import { buildIdeLoaderLocation } from '@/services/helpers/location';
import { AlertItem } from '@/services/helpers/types';
import { Workspace } from '@/services/workspace-adapter';
import { AppState } from '@/store';
import * as DevfileRegistriesStore from '@/store/DevfileRegistries';
import { DevWorkspaceResources } from '@/store/DevfileRegistries';
import { selectDevWorkspaceResources } from '@/store/DevfileRegistries/selectors';
import * as FactoryResolverStore from '@/store/FactoryResolver';
import {
  selectFactoryResolver,
  selectFactoryResolverConverted,
} from '@/store/FactoryResolver/selectors';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import * as WorkspacesStore from '@/store/Workspaces';
import * as DevWorkspacesStore from '@/store/Workspaces/devWorkspaces';
import { selectDevWorkspaceWarnings } from '@/store/Workspaces/devWorkspaces/selectors';
import { selectAllWorkspaces } from '@/store/Workspaces/selectors';

export type Props = MappedProps &
  ProgressStepProps & {
    searchParams: URLSearchParams;
  };
export type State = ProgressStepState & {
  factoryParams: FactoryParams;
  newWorkspaceName?: string;
  resources?: DevWorkspaceResources;
  shouldCreate: boolean; // should the loader create a workspace
  warning?: string; // the devWorkspace warning to show
};

class CreatingStepApplyResources extends ProgressStep<Props, State> {
  protected readonly name = 'Applying resources';

  constructor(props: Props) {
    super(props);

    this.state = {
      factoryParams: buildFactoryParams(props.searchParams),
      shouldCreate: true,
      name: this.name,
    };
  }

  public componentDidMount() {
    this.init();
  }

  public componentDidUpdate() {
    this.init();
  }

  public shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // active step changed
    if (this.props.distance !== nextProps.distance) {
      return true;
    }

    const workspace = this.findTargetWorkspace(this.props, this.state);
    const nextWorkspace = this.findTargetWorkspace(nextProps, nextState);

    // new workspace appeared
    if (workspace === undefined && nextWorkspace !== undefined) {
      return true;
    }

    // current step failed
    if (!isEqual(this.state.lastError, nextState.lastError)) {
      return true;
    }

    if (this.state.shouldCreate !== nextState.shouldCreate) {
      return true;
    }

    if (this.state.newWorkspaceName !== nextState.newWorkspaceName) {
      return true;
    }

    // a warning appeared
    if (
      workspace !== undefined &&
      nextWorkspace !== undefined &&
      this.props.devWorkspaceWarnings[workspace.uid] !==
        nextProps.devWorkspaceWarnings[nextWorkspace.uid]
    ) {
      return true;
    }

    return false;
  }

  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  private init() {
    if (this.props.distance !== 0) {
      return;
    }

    if (this.state.lastError) {
      return;
    }

    const workspace = this.findTargetWorkspace(this.props, this.state);

    if (workspace) {
      // prevent a workspace being created one more time
      this.setState({
        shouldCreate: false,
      });

      const warning = this.props.devWorkspaceWarnings[workspace.uid];
      if (warning) {
        this.setState({
          warning,
        });
      }
    }

    this.prepareAndRun();
  }

  protected handleRestart(alertKey: string): void {
    this.props.onHideError(alertKey);

    this.setState({
      shouldCreate: true,
      newWorkspaceName: undefined,
    });
    this.clearStepError();
    this.props.onRestart();
  }

  protected handleTimeout(): void {
    const timeoutError = new Error(
      `Workspace hasn't been created in the last ${TIMEOUT_TO_CREATE_SEC} seconds.`,
    );
    this.handleError(timeoutError);
  }

  protected async runStep(): Promise<boolean> {
    const { devWorkspaceResources } = this.props;
    const { factoryParams, shouldCreate, resources, warning } = this.state;
    const { cheEditor, factoryId, sourceUrl, storageType, policiesCreate } = factoryParams;

    if (warning) {
      const newName = `Warning: ${warning}`;
      if (this.state.name !== newName) {
        this.setState({
          name: newName,
        });
        this.forceUpdate();
      }
    }

    const targetWorkspace = this.findTargetWorkspace(this.props, this.state);
    if (targetWorkspace) {
      // the workspace has been created, go to the next step
      const nextLocation = buildIdeLoaderLocation(targetWorkspace);
      this.props.history.location.pathname = nextLocation.pathname;
      this.props.history.location.search = '';
      return true;
    }

    if (shouldCreate === false) {
      throw new Error('The workspace creation unexpectedly failed.');
    }

    if (resources === undefined) {
      const _resources = devWorkspaceResources[sourceUrl]?.resources;
      if (_resources === undefined) {
        throw new Error('Failed to fetch devworkspace resources.');
      }

      // test the devWorkspace name to decide if we need to append a suffix to is
      const nameConflict = this.props.allWorkspaces.some(
        w => _resources[0].metadata.name === w.name,
      );
      const appendSuffix = policiesCreate === 'perclick' || nameConflict;

      // create a workspace using pre-generated resources
      const [devWorkspace, devWorkspaceTemplate] = prepareResources(
        _resources,
        factoryId,
        storageType,
        appendSuffix,
      );

      this.setState({
        newWorkspaceName: devWorkspace.metadata.name,
        resources: [devWorkspace, devWorkspaceTemplate],
      });
      return false;
    }

    await this.props.createWorkspaceFromResources(...resources, cheEditor);

    // wait for the workspace creation to complete
    return false;
  }

  private findTargetWorkspace(props: Props, state: State): Workspace | undefined {
    if (state.newWorkspaceName === undefined) {
      return undefined;
    }
    return findTargetWorkspace(props.allWorkspaces, {
      namespace: props.defaultNamespace.name,
      workspaceName: state.newWorkspaceName,
    });
  }

  protected buildAlertItem(error: Error): AlertItem {
    const key = this.name;
    return {
      key,
      title: 'Failed to create the workspace',
      variant: AlertVariant.danger,
      children: helpers.errors.getMessage(error),
      actionCallbacks: [
        {
          title: 'Click to try again',
          callback: () => this.handleRestart(key),
        },
      ],
    };
  }

  render(): React.ReactElement {
    const { distance, hasChildren } = this.props;
    const { name, lastError, warning } = this.state;

    const isActive = distance === 0;
    const isError = lastError !== undefined;
    const isWarning = warning !== undefined;

    return (
      <React.Fragment>
        {isActive && (
          <TimeLimit timeLimitSec={TIMEOUT_TO_CREATE_SEC} onTimeout={() => this.handleTimeout()} />
        )}
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

const mapStateToProps = (state: AppState) => ({
  allWorkspaces: selectAllWorkspaces(state),
  defaultNamespace: selectDefaultNamespace(state),
  factoryResolver: selectFactoryResolver(state),
  factoryResolverConverted: selectFactoryResolverConverted(state),
  devWorkspaceResources: selectDevWorkspaceResources(state),
  devWorkspaceWarnings: selectDevWorkspaceWarnings(state),
});

const connector = connect(
  mapStateToProps,
  {
    ...DevfileRegistriesStore.actionCreators,
    ...FactoryResolverStore.actionCreators,
    ...WorkspacesStore.actionCreators,
    createWorkspaceFromResources: DevWorkspacesStore.actionCreators.createWorkspaceFromResources,
  },
  null,
  {
    // forwardRef is mandatory for using `@react-mock/state` in unit tests
    forwardRef: true,
  },
);
type MappedProps = ConnectedProps<typeof connector>;
export default connector(CreatingStepApplyResources);
