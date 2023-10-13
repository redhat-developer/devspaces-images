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

import { FormGroup } from '@patternfly/react-core';
import React from 'react';

import overviewStyles from '@/pages/WorkspaceDetails/OverviewTab/index.module.css';

type Props = {
  namespace: string;
};

class InfrastructureNamespaceFormGroup extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    return (
      <FormGroup label="Kubernetes Namespace" fieldId="infrastructure-namespace">
        <div className={overviewStyles.readonly}>{this.props.namespace}</div>
      </FormGroup>
    );
  }
}

export default InfrastructureNamespaceFormGroup;
