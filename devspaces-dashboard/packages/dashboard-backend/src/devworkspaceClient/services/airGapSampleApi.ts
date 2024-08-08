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

import { api } from '@eclipse-che/common';
import * as console from 'console';
import * as fs from 'fs';
import path from 'path';

import { IAirGapSampleApi } from '@/devworkspaceClient/types';
import { isLocalRun } from '@/localRun';

export class AirGapSampleApiService implements IAirGapSampleApi {
  protected readonly airGapResourcesDir: string;
  protected readonly airGapIndexFilePath: string;
  protected readonly samples: Array<api.IAirGapSample>;
  constructor(airGapResourcesDir?: string) {
    this.airGapResourcesDir = airGapResourcesDir
      ? airGapResourcesDir
      : isLocalRun()
        ? path.join(
            __dirname,
            '../../../dashboard-frontend/lib/public/dashboard/devfile-registry/air-gap',
          )
        : '/public/dashboard/devfile-registry/air-gap';
    this.airGapIndexFilePath = path.join(this.airGapResourcesDir, 'index.json');
    this.samples = this.readAirGapIndex();
  }

  async list(): Promise<Array<api.IAirGapSample>> {
    return this.samples;
  }

  async downloadProject(id: string): Promise<api.IStreamedFile> {
    const sample = this.samples.find(sample => sample.id === id);
    if (sample) {
      return this.download(sample.project?.zip?.filename);
    }

    console.error(`Sample not found: ${id} `);
    throw new Error(`Sample not found`);
  }

  async downloadDevfile(id: string): Promise<api.IStreamedFile> {
    const sample = this.samples.find(sample => sample.id === id);
    if (sample) {
      return this.download(sample.devfile?.filename);
    }

    console.error(`Sample not found: ${id} `);
    throw new Error(`Sample not found`);
  }

  private readAirGapIndex(): Array<api.IAirGapSample> {
    if (!fs.existsSync(this.airGapIndexFilePath)) {
      return [];
    }

    try {
      const data = fs.readFileSync(this.airGapIndexFilePath, 'utf8');
      return JSON.parse(data) as api.IAirGapSample[];
    } catch (e) {
      console.error(e, 'Failed to read air-gap index.json');
      throw new Error('Failed to read air-gap index.json');
    }
  }

  private download(filename?: string): api.IStreamedFile {
    if (!filename) {
      console.error(`filename not defined`);
      throw new Error(`filename not defined`);
    }

    const filepath = path.resolve(this.airGapResourcesDir, filename);

    // This is a security check to ensure that the file is within the airGapResourcesDir
    if (!filepath.startsWith(this.airGapResourcesDir)) {
      console.error(`Invalid file path: ${filepath}`);
      throw new Error(`Invalid file path`);
    }

    if (!fs.existsSync(filepath)) {
      console.error(`File not found: ${filepath}`);
      throw new Error(`File not found`);
    }

    try {
      const stats = fs.statSync(filepath);
      return { stream: fs.createReadStream(filepath), size: stats.size };
    } catch (err) {
      console.error(`Error reading file: ${filepath}`, err);
      throw new Error(`Error reading file`);
    }
  }
}
