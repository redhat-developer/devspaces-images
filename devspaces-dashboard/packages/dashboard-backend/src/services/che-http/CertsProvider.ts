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

import * as fs from 'fs-extra';
import * as path from 'path';

export class CertsProvider {
  // self signed cert used for Che routing
  public static CHE_SS_CRT_PATH = '/public-certs/che-self-signed/ca.crt';
  // custom self-signed cert used for Che routing
  public static CUSTOM_CRTS_PATH = '/public-certs/custom';

  public async getCertificateAuthority(): Promise<Array<Buffer> | undefined> {
    const certificateAuthority: Buffer[] = [];
    const existsSSCRT = await fs.pathExists(CertsProvider.CHE_SS_CRT_PATH);
    if (existsSSCRT) {
      const content = await fs.readFile(CertsProvider.CHE_SS_CRT_PATH);
      certificateAuthority.push(content);
    }

    const existsPublicCrt = await fs.pathExists(CertsProvider.CUSTOM_CRTS_PATH);
    if (existsPublicCrt) {
      const publicCertificates = await fs.readdir(CertsProvider.CUSTOM_CRTS_PATH);
      for (const publicCertificate of publicCertificates) {
        const certPath = path.join(CertsProvider.CUSTOM_CRTS_PATH, publicCertificate);
        if ((await fs.pathExists(certPath)) && (await fs.stat(certPath)).isFile()) {
          const content = await fs.readFile(certPath);
          certificateAuthority.push(content);
        }
      }
    }

    return certificateAuthority.length > 0 ? certificateAuthority : undefined;
  }
}
