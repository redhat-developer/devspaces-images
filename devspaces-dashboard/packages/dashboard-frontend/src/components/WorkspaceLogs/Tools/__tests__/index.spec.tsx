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
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import WorkspaceLogsTools from '..';

jest.mock('../../../../services/helpers/tools', () => {
  return {
    getBlobUrl: (text: string) => encodeURI(`https://fake.blob.url?blobText=${text}`),
  };
});

describe('The LogsTools component', () => {
  it('should render the component correctly', () => {
    const logs = [
      'Pulling image "quay.io/eclipse/che-theia-endpoint-runtime-binary:next"',
      'Successfully pulled image "quay.io/eclipse/che-theia-endpoint-runtime-binary:next"',
      'Created container remote-runtime-injectorvpj',
      'Started container remote-runtime-injectorvpj',
      'Pulling image "quay.io/eclipse/che-plugin-artifacts-broker:v3.4.0"',
      'Successfully pulled image "quay.io/eclipse/che-plugin-artifacts-broker:v3.4.0"',
      'Created container che-plugin-artifacts-broker-v3-4-0',
      'Started container che-plugin-artifacts-broker-v3-4-0',
      'Pulling image "quay.io/eclipse/che-jwtproxy:0.10.0"',
    ];
    const handleExpand = jest.fn();

    const component = renderComponent(logs, handleExpand);

    expect(handleExpand).not.toBeCalled();
    expect(component.toJSON()).toMatchSnapshot();
  });
});

function renderComponent(
  logs: string[],
  handleExpand: (isExpand: boolean) => void,
): ReactTestRenderer {
  return renderer.create(
    <WorkspaceLogsTools logs={logs} handleExpand={handleExpand} shouldToggleNavbar />,
  );
}
