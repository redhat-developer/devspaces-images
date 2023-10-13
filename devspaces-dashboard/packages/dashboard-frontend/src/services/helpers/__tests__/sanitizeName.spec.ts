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

import sanitizeName from '@/services/helpers/sanitizeName';

describe('sanitizeName', () => {
  test('correct name', () => {
    const name = 'test-project';
    const sanitizedName = sanitizeName(name);
    expect(sanitizedName).toEqual('test-project');
  });

  test('with uppercase character', () => {
    const name = 'testProject';
    const sanitizedName = sanitizeName(name);
    expect(sanitizedName).toEqual('testproject');
  });

  test('with non-alphanumeric character in the middle', () => {
    const name = 'test%-#project';
    const sanitizedName = sanitizeName(name);
    expect(sanitizedName).toEqual('test---project');
  });

  test('with non-alphanumeric first characters', () => {
    const name = '-@&test-project';
    const sanitizedName = sanitizeName(name);
    expect(sanitizedName).toEqual('test-project');
  });

  test('with non-alphanumeric last characters', () => {
    const name = 'test-project-@&';
    const sanitizedName = sanitizeName(name);
    expect(sanitizedName).toEqual('test-project');
  });
});
