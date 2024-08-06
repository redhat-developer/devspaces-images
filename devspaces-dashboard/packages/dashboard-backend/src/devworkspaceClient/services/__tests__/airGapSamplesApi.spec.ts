/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import path from 'path';

import { AirGapSampleApiService } from '@/devworkspaceClient/services/airGapSampleApi';

describe('Getting Started Samples API Service', () => {
  let airGapSampleApiService: AirGapSampleApiService;

  beforeEach(() => {
    jest.resetModules();
    airGapSampleApiService = new AirGapSampleApiService(
      path.join(__dirname, 'fixtures', 'air-gap'),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('fetching metadata', async () => {
    const res = await airGapSampleApiService.list();
    expect(res.length).toEqual(6);
  });

  test('reading devfile', async () => {
    const airGapResource = await airGapSampleApiService.downloadDevfile('Sample_devfile');
    const devfileContent = await streamToString(airGapResource.stream);
    expect(devfileContent.length).toEqual(airGapResource.size);
    expect(devfileContent).toEqual(
      'schemaVersion: 2.2.0\n' + 'metadata:\n' + '  generateName: empty\n',
    );
  });

  test('reading project', async () => {
    const airGapResource = await airGapSampleApiService.downloadProject('Sample_project');
    const devfileContent = await streamToString(airGapResource.stream);
    expect(devfileContent.length).toEqual(airGapResource.size);
    expect(devfileContent).toEqual('project');
  });

  test('error reading devfile, if field not specified', async () => {
    try {
      await airGapSampleApiService.downloadDevfile('Sample_no_devfile_filename');
      fail('should throw an error');
    } catch (e: any) {
      expect(e.message).toEqual('filename not defined');
    }
  });

  test('error reading project, if field not specified', async () => {
    try {
      await airGapSampleApiService.downloadProject('Sample_no_project_filename');
      fail('should throw an error');
    } catch (e: any) {
      expect(e.message).toEqual('filename not defined');
    }
  });

  test('error reading devfile, if devfile does not exist', async () => {
    try {
      await airGapSampleApiService.downloadDevfile('Sample_devfile_not_exists');
      fail('should throw an error');
    } catch (e: any) {
      expect(e.message).toEqual('File not found');
    }
  });

  test('error reading project, if project does not exist', async () => {
    try {
      await airGapSampleApiService.downloadProject('Sample_project_not_exists');
      fail('should throw an error');
    } catch (e: any) {
      expect(e.message).toEqual('File not found');
    }
  });

  test('error reading devfile, sample not found', async () => {
    try {
      await airGapSampleApiService.downloadDevfile('Sample_not_exists');
      fail('should throw an error');
    } catch (e: any) {
      expect(e.message).toEqual('Sample not found');
    }
  });

  test('error reading project, sample not found', async () => {
    try {
      await airGapSampleApiService.downloadProject('Sample_not_exists');
      fail('should throw an error');
    } catch (e: any) {
      expect(e.message).toEqual('Sample not found');
    }
  });
});

function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}
