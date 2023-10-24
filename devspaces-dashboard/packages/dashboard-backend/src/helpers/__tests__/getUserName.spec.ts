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

import { getUserName } from '@/helpers/getUserName';
import { logger } from '@/utils/logger';

describe('helpers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserName', () => {
    it('should return name', () => {
      const token =
        'header.' +
        Buffer.from(
          '{"iss":"https://dex.myhost","aud":"eclipse-che","exp":1234567890,"iat":1234567890,"email":"user1@che","email_verified":true,"name":"user1"}',
        ).toString('base64') +
        '.signature';
      const name = getUserName(token);
      expect(name).toEqual('user1');
    });

    it('should return undefined', () => {
      const token =
        'header.' +
        Buffer.from(
          '{"aud":["https://kubernetes.default.svc"],"exp":1234567890,"iat":1234567890,"iss":"https://kubernetes.default.svc","kubernetes.io":{"namespace":"eclipse-che","pod":{"name":"che-dashboard-123456789-0abcd","uid":"12345678-90ab-cedf-1234-567890abcdef"},"serviceaccount":{"name":"che-dashboard","uid":"12345678-90ab-cedf-1234-567890abcdef"},"warnafter":1234567890},"nbf":1234567890,"sub":"system:serviceaccount:eclipse-che:che-dashboard"}',
        ).toString('base64') +
        '.signature';
      const name = getUserName(token);
      expect(name).toBeUndefined();
    });

    it('should log error and throw', () => {
      const token =
        'header.' +
        Buffer.from(
          ']]]{"iss":"https://dex.myhost","aud":"eclipse-che","exp":1234567890,"iat":1234567890,"email":"user1@che","email_verified":true,"name":"user1"}',
        ).toString('base64') +
        '.signature';

      expect(() => getUserName(token)).toThrow();
      expect(logger.warn).toHaveBeenCalledWith(`Can't parse the token payload.`);
    });
  });
});
