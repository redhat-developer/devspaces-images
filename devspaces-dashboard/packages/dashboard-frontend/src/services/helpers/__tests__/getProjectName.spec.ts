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

import { getProjectName } from '../getProjectName';

describe('Get a project name based on location', () => {
  it('should return a valid name less then 63 symbols', () => {
    let cloneUrl = 'http://dummy/test.com/project-demo';

    cloneUrl += 'a'.repeat(100);
    const projectName = getProjectName(cloneUrl);

    expect(projectName).toEqual('project-demo' + 'a'.repeat(50));
  });

  it('should return a valid name which has the first char [a-z0-9]', () => {
    const cloneUrl = 'http://dummy/test.com/$_Project-Demo';

    const projectName = getProjectName(cloneUrl);

    expect(projectName).toEqual('project-demo');
  });

  it('should return a valid name which has the last char [a-z0-9]', () => {
    const cloneUrl = 'http://dummy/test.com/project-demo-$';

    const projectName = getProjectName(cloneUrl);

    expect(projectName).toEqual('project-demo');
  });

  it('should return a valid name after replacement of forbidden characters [^-a-z0-9] to "-"', () => {
    const cloneUrl = 'http://dummy/test.com/proj$$$$$___$ect-de$$$$_____mo';

    const projectName = getProjectName(cloneUrl);

    expect(projectName).toEqual('proj-ect-de-mo');
  });
});
