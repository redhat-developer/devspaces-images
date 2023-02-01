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
import { FormGroup } from '@patternfly/react-core';

import overviewStyles from './index.module.css';

type Props = {
  projects: string[];
};

class ProjectsFormGroup extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const projects = this.props.projects.join(', ');
    return (
      <FormGroup label="Projects" fieldId="projects">
        <div className={overviewStyles.readonly}>{projects}</div>
      </FormGroup>
    );
  }
}

export default ProjectsFormGroup;
