/*
 * Copyright (c) 2018-2020 Red Hat, Inc.
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
import { connect, ConnectedProps } from 'react-redux';
import { FormGroup, Tooltip, TextInput } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import { AppState } from '../../../../store';
import { InfrastructureNamespaceSelect } from './InfrastructureNamespaceSelect';

import styles from './index.module.css';

type Props =
  MappedProps
  & {
    onChange: (namespace: che.KubernetesNamespace) => void;
  };

export class InfrastructureNamespaceFormGroup extends React.PureComponent<Props> {

  private namespaces: che.KubernetesNamespace[];
  private fieldId = 'infrastructure-namespace';

  constructor(props: Props) {
    super(props);

    this.namespaces = this.props.infrastructureNamespace.namespaces;
  }

  private buildInfrastructureNamespaces(): React.ReactNode {
    const namespaces = this.namespaces;
    if (namespaces.length === 0) {
      return;
    }

    if (namespaces.length === 1) {
      const name = this.namespaces[0].attributes.displayName
        || this.namespaces[0].name;
      return (
        <TextInput
          aria-describedby="infrastructure-namespace-helper"
          id={this.fieldId}
          isDisabled
          name="infrastructure-namespace"
          readOnly
          type="text"
          value={name}
        />
      );
    }

    return (
      <InfrastructureNamespaceSelect
        fieldId={this.fieldId}
        namespaces={this.namespaces}
        onSelect={namespace => this.props.onChange(namespace)}
      />
    );
  }

  public render(): React.ReactElement {
    const infrastructureNamespaces = this.buildInfrastructureNamespaces();

    return (
      <FormGroup
        label="Namespace"
        fieldId={this.fieldId}
        labelIcon={
          <Tooltip
            isContentLeftAligned
            content={
              <div>The infrastructure namespace where the workspace will be created.</div>
            }
          >
            <QuestionCircleIcon />
          </Tooltip>
        }
      >
        <div className={styles.namespaceSelector}>
          {infrastructureNamespaces}
        </div>
      </FormGroup>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  infrastructureNamespace: state.infrastructureNamespace,
});

const connector = connect(
  mapStateToProps
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(InfrastructureNamespaceFormGroup);
