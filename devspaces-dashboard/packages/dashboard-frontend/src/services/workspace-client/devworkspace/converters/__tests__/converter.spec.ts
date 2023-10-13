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

import * as fs from 'fs';
import * as yaml from 'js-yaml';

import { devfileSchemaVersion, devfileToDevWorkspace, devWorkspaceToDevfile } from '..';

describe('testing sample conversions', () => {
  describe('devfile to devworkspace', () => {
    test('the sample-devfile-plugins fixture should convert into sample-devworkspace fixture', () => {
      const input: any = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/sample-devfile-plugins.yaml', 'utf-8'),
      );
      const output = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/sample-devworkspace.yaml', 'utf-8'),
      );
      expect(devfileToDevWorkspace(input, 'che', true)).toStrictEqual(output);
    });
  });
  describe('devworkspace to devfile', () => {
    // mute the outputs
    console.debug = jest.fn();

    test('the sample-devworkspace fixture should convert into sample-devfile fixture', () => {
      const input: any = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/sample-devworkspace.yaml', 'utf-8'),
      );
      const output = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/sample-devfile.yaml', 'utf-8'),
      );
      delete (output as any).metadata.attributes;
      expect(devWorkspaceToDevfile(input)).toStrictEqual(output);
    });

    test('the test-devworkspace-devfile-annotation fixture should convert into test-devfile-metadata-description fixture', () => {
      const input: any = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/test-devworkspace-devfile-annotation.yaml', 'utf-8'),
      );
      const output = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/test-devfile-metadata-description.yaml', 'utf-8'),
      );
      expect(devWorkspaceToDevfile(input)).toStrictEqual(output);
    });

    test('should eliminate the devworkspace devfile annotation in the case with an error', () => {
      const input: any = yaml.load(
        fs.readFileSync(
          __dirname + '/fixtures/test-devworkspace-devfile-annotation-error.yaml',
          'utf-8',
        ),
      );
      const devfile = devWorkspaceToDevfile(input);
      expect(console.debug).toBeCalledWith(
        'Failed to parse the origin devfile. The target object is not devfile V2.',
      );
      expect(devfile.schemaVersion).toEqual(devfileSchemaVersion);
    });
  });
  describe('parent section', () => {
    test('the test-devfile-parent fixture should convert into test-devworkspace-parent fixture', () => {
      const input: any = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/test-devfile-parent.yaml', 'utf-8'),
      );
      const output = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/test-devworkspace-parent.yaml', 'utf-8'),
      );
      expect(devfileToDevWorkspace(input, 'che', true)).toStrictEqual(output);
    });

    test('the test-devworkspace-parent fixture should convert into test-devfile-parent fixture', () => {
      const input: any = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/test-devworkspace-parent.yaml', 'utf-8'),
      );
      const output = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/test-devfile-parent.yaml', 'utf-8'),
      );
      delete (output as any).metadata.attributes;
      expect(devWorkspaceToDevfile(input)).toStrictEqual(output);
    });
  });
  describe('storage-type section', () => {
    test('the test-devfile-ephemeral fixture should convert into test-devworkspace-ephemeral fixture', () => {
      const input: any = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/test-devfile-ephemeral.yaml', 'utf-8'),
      );
      const output = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/test-devworkspace-ephemeral.yaml', 'utf-8'),
      );
      expect(devfileToDevWorkspace(input, 'che', true)).toStrictEqual(output);
    });

    test('the test-devworkspace-ephemeral fixture should convert into test-devfile-ephemeral fixture', () => {
      const input: any = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/test-devworkspace-ephemeral.yaml', 'utf-8'),
      );
      const output = yaml.load(
        fs.readFileSync(__dirname + '/fixtures/test-devfile-ephemeral.yaml', 'utf-8'),
      );
      delete (output as any).metadata.attributes;
      expect(devWorkspaceToDevfile(input)).toStrictEqual(output);
    });
  });
});
