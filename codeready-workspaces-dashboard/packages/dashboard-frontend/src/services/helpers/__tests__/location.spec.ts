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

import { buildFactoryLoaderLocation } from '../location';

describe('Location test', () => {
  test('new policy', () => {
    const result = buildFactoryLoaderLocation(
      'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2?new=',
    );
    expect(result.search).toBe(
      '?url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-spring-petclinic%2Ftree%2Fdevfilev2&policies.create=perclick',
    );
  });

  test('che-editor parameter', () => {
    const result = buildFactoryLoaderLocation(
      'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2?che-editor=che-incubator/checode/insiders',
    );
    expect(result.search).toBe(
      '?url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-spring-petclinic%2Ftree%2Fdevfilev2&che-editor=che-incubator/checode/insiders',
    );
  });

  test('devfilePath parameter', () => {
    const result = buildFactoryLoaderLocation(
      'https://github.com/che-samples/java-spring-petclinic/tree/devfilev2?devfilePath=devfilev2.yaml',
    );
    expect(result.search).toBe(
      '?url=https%3A%2F%2Fgithub.com%2Fche-samples%2Fjava-spring-petclinic%2Ftree%2Fdevfilev2&override.devfileFilename=devfilev2.yaml',
    );
  });
});
