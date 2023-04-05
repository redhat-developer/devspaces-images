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

import * as fs from 'fs-extra';
import path from 'path';
import * as axios from 'axios';
import https from 'https';

export interface ICrtConfig {
  ssCrtPath?: string;
  publicCrtPath?: string;
}

const DEFAULT_CHE_SELF_SIGNED_MOUNT_PATH = '/public-certs/che-self-signed';
const CHE_SELF_SIGNED_MOUNT_PATH = process.env.CHE_SELF_SIGNED_MOUNT_PATH;

const certificateAuthority = getCertificateAuthority({
  publicCrtPath: CHE_SELF_SIGNED_MOUNT_PATH
    ? CHE_SELF_SIGNED_MOUNT_PATH
    : DEFAULT_CHE_SELF_SIGNED_MOUNT_PATH,
});

export const axiosInstance = certificateAuthority
  ? axios.default.create({
      httpsAgent: new https.Agent({
        ca: certificateAuthority,
      }),
    })
  : axios.default;

function getCertificateAuthority(config: ICrtConfig): Buffer[] | undefined {
  const certificateAuthority: Buffer[] = [];
  if (config.ssCrtPath && fs.existsSync(config.ssCrtPath)) {
    certificateAuthority.push(fs.readFileSync(config.ssCrtPath));
  }

  if (config.publicCrtPath && fs.existsSync(config.publicCrtPath)) {
    const publicCertificates = fs.readdirSync(config.publicCrtPath);
    for (const publicCertificate of publicCertificates) {
      if (publicCertificate.endsWith('.crt')) {
        const certPath = path.join(config.publicCrtPath, publicCertificate);
        certificateAuthority.push(fs.readFileSync(certPath));
      }
    }
  }

  return certificateAuthority.length > 0 ? certificateAuthority : undefined;
}
