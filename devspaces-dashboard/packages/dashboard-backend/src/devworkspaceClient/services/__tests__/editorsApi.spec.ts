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

import { V222Devfile } from '@devfile/api';
import { V1ConfigMapList } from '@kubernetes/client-node/dist/gen/model/v1ConfigMapList';
import http from 'http';
import * as yaml from 'js-yaml';

import { EditorNotFoundError, EditorsApiService } from '@/devworkspaceClient/services/editorsApi';
import { createError } from '@/devworkspaceClient/services/helpers/createError';
import { prepareCoreV1API } from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import { logger } from '@/utils/logger';

jest.mock('@kubernetes/client-node');
jest.mock('@/devworkspaceClient/services/helpers/createError');
jest.mock('@/devworkspaceClient/services/helpers/prepareCoreV1API');
jest.mock('js-yaml');
jest.mock('@/utils/logger');

describe('EditorsApiService', () => {
  let coreV1API: any;
  let editorsApiService: EditorsApiService;

  beforeEach(() => {
    coreV1API = {
      listNamespacedConfigMap: jest.fn(),
    };
    (prepareCoreV1API as jest.Mock).mockReturnValue(coreV1API);
    editorsApiService = new EditorsApiService();
    process.env.CHECLUSTER_CR_NAMESPACE = 'test-namespace';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return an empty list if NAMESPACE is not defined', async () => {
      delete process.env.CHECLUSTER_CR_NAMESPACE;
      const result = await editorsApiService.list();
      expect(result).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith(
        'Mandatory environment variables are not defined: $CHECLUSTER_CR_NAMESPACE',
      );
    });

    it('should return a list of editors', async () => {
      const configMapData = {
        'editor.yaml': 'apiVersion: 2.2.2',
      };
      const configMap = {
        metadata: { name: 'editor-configmap' },
        data: configMapData,
      };
      const configMapList = {
        items: [configMap],
      } as V1ConfigMapList;
      const response = { response: {} as http.IncomingMessage, body: configMapList };

      (coreV1API.listNamespacedConfigMap as jest.Mock).mockResolvedValue(response);
      (yaml.load as jest.Mock).mockReturnValue({ schemaVersion: '2.2.2' });

      const result = await editorsApiService.list();
      expect(result).toEqual([{ schemaVersion: '2.2.2' } as V222Devfile]);
      expect(coreV1API.listNamespacedConfigMap).toHaveBeenCalledWith(
        'test-namespace',
        undefined,
        undefined,
        undefined,
        undefined,
        'app.kubernetes.io/component=editor-definition,app.kubernetes.io/part-of=che.eclipse.org',
      );
    });

    it('should handle errors from the Kubernetes API', async () => {
      const error = new Error('API error');
      const additionalMessage = 'Unable to list editors ConfigMap';

      (coreV1API.listNamespacedConfigMap as jest.Mock).mockRejectedValue(error);
      (createError as jest.Mock).mockReturnValue(new Error(`${additionalMessage}`));

      await expect(editorsApiService.list()).rejects.toThrow(`${additionalMessage}`);
      expect(createError).toHaveBeenCalledWith(error, 'CORE_V1_API_ERROR', additionalMessage);
    });

    it('should handle YAML parsing errors', async () => {
      const configMapData = {
        'editor.yaml': 'invalid yaml',
      };
      const configMap = {
        metadata: { name: 'editor-configmap' },
        data: configMapData,
      };
      const configMapList = {
        items: [configMap],
      } as V1ConfigMapList;
      const response = { response: {} as http.IncomingMessage, body: configMapList };
      const parseError = new Error('YAML parse error');

      (coreV1API.listNamespacedConfigMap as jest.Mock).mockResolvedValue(response);
      (yaml.load as jest.Mock).mockImplementation(() => {
        throw parseError;
      });

      const result = await editorsApiService.list();
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        parseError,
        'Failed to parse editor: %s from %s Config Map',
        'editor.yaml',
        'editor-configmap',
      );
    });
  });

  describe('get', () => {
    it('should return matching editor yaml when provided with editorId', async () => {
      const editor = `
      apiVersion: 2.2.2
      metadata:
        name: che-code
        attributes:
          publisher: che-incubator
          version: insiders
      `;
      const configMapData = {
        'editor.yaml': editor,
      };
      const configMap = {
        metadata: { name: 'editor-configmap' },
        data: configMapData,
      };
      const configMapList = {
        items: [configMap],
      } as V1ConfigMapList;
      const response = { response: {} as http.IncomingMessage, body: configMapList };

      (coreV1API.listNamespacedConfigMap as jest.Mock).mockResolvedValue(response);
      (yaml.load as jest.Mock).mockReturnValue({
        schemaVersion: '2.2.2',
        metadata: {
          name: 'che-code',
          attributes: {
            publisher: 'che-incubator',
            version: 'insiders',
          },
        },
      });

      const result = await editorsApiService.get('che-incubator/che-code/insiders');
      expect(result).toEqual({
        schemaVersion: '2.2.2',
        metadata: {
          name: 'che-code',
          attributes: {
            publisher: 'che-incubator',
            version: 'insiders',
          },
        },
      } as V222Devfile);
    });

    it('should return matching editor yaml when provided with editorId when multiple editors exist', async () => {
      const editor1 = `
      apiVersion: 2.2.2
      metadata:
        name: che-code
        attributes:
          publisher: che-incubator
          version: insiders
      `;
      const editor2 = `
      apiVersion: 2.2.2
      metadata:
        name: che-code
        attributes:
          publisher: che-incubator
          version: latest
      `;
      const configMapData = {
        'editor1.yaml': editor1,
        'editor2.yaml': editor2,
      };
      const configMap = {
        metadata: { name: 'editor-configmap' },
        data: configMapData,
      };
      const configMapList = {
        items: [configMap],
      } as V1ConfigMapList;
      const response = { response: {} as http.IncomingMessage, body: configMapList };

      (coreV1API.listNamespacedConfigMap as jest.Mock).mockResolvedValue(response);
      (yaml.load as jest.Mock)
        .mockReturnValueOnce({
          schemaVersion: '2.2.2',
          metadata: {
            name: 'che-code',
            attributes: {
              publisher: 'che-incubator',
              version: 'insiders',
            },
          },
        })
        .mockReturnValueOnce({
          schemaVersion: '2.2.2',
          metadata: {
            name: 'che-code',
            attributes: {
              publisher: 'che-incubator',
              version: 'latest',
            },
          },
        });

      const result = await editorsApiService.get('che-incubator/che-code/latest');
      expect(result).toEqual({
        schemaVersion: '2.2.2',
        metadata: {
          name: 'che-code',
          attributes: {
            publisher: 'che-incubator',
            version: 'latest',
          },
        },
      } as V222Devfile);
    });

    it('should throw exception if no matching editor exists', async () => {
      const editor = `
      apiVersion: 2.2.2
      metadata:
        name: che-code
        attributes:
          publisher: che-incubator
          version: insiders
      `;
      const configMapData = {
        'editor.yaml': editor,
      };
      const configMap = {
        metadata: { name: 'editor-configmap' },
        data: configMapData,
      };
      const configMapList = {
        items: [configMap],
      } as V1ConfigMapList;
      const response = { response: {} as http.IncomingMessage, body: configMapList };

      (coreV1API.listNamespacedConfigMap as jest.Mock).mockResolvedValue(response);
      (yaml.load as jest.Mock).mockReturnValue({
        schemaVersion: '2.2.2',
        metadata: {
          name: 'che-code',
          attributes: {
            publisher: 'che-incubator',
            version: 'insiders',
          },
        },
      });
      const expectedError = new EditorNotFoundError(
        "Editor with id: 'che-incubator/che-code/latest' not found",
      );
      await expect(editorsApiService.get('che-incubator/che-code/latest')).rejects.toThrow(
        expectedError,
      );
    });
  });
});
