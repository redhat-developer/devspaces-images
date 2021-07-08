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

import { IDevWorkspace } from '@eclipse-che/devworkspace-client';
import { convertWorkspace } from '..';
import { CheWorkspaceBuilder, CHE_DEVFILE_STUB, CHE_RUNTIME_STUB } from '../../../store/__mocks__/cheWorkspaceBuilder';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import { StorageTypeTitle } from '../../storageTypes';

describe('Workspace adapter', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('converting workspaces', () => {

    it('should not throw when convert Che workspace', () => {
      const cheWorkspace = new CheWorkspaceBuilder().build();
      expect(() => {
        convertWorkspace(cheWorkspace);
      }).not.toThrow();
    });

    it('should not throw when convert Dev workspace', () => {
      const devWorkspace = new DevWorkspaceBuilder().build();
      expect(() => {
        convertWorkspace(devWorkspace);
      }).not.toThrow();
    });

    it('should throw when convert not Che nor Dev workspace', () => {
      console.error = jest.fn();

      const obj = {
        field: 'value',
      } as any;
      expect(() => {
        convertWorkspace(obj);
      }).toThrow();
    });

  });

  describe('for Che workspace', () => {

    it('should return reference to the workspace', () => {
      const cheWorkspace = new CheWorkspaceBuilder().build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.ref).toMatchObject(cheWorkspace);
    });

    it('should return ID', () => {
      const id = '1234asdf';
      const cheWorkspace = new CheWorkspaceBuilder()
        .withId(id)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.id).toEqual(id);
    });

    it('should return name', () => {
      const name = 'wksp-1234';
      const cheWorkspace = new CheWorkspaceBuilder()
        .withName(name)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.name).toEqual(name);
    });

    it('should return namespace', () => {
      const namespace = 'test-namespace';
      const cheWorkspace = new CheWorkspaceBuilder()
        .withNamespace(namespace)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.namespace).toEqual(namespace);
    });

    it('should return infrastructure namespace', () => {
      const infrastructureNamespace = 'infrastructure-namespace';
      const cheWorkspace = new CheWorkspaceBuilder()
        .withAttributes({
          infrastructureNamespace,
        } as che.WorkspaceAttributes)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.infrastructureNamespace).toEqual(infrastructureNamespace);
    });

    it('should return timestamp of creating', () => {
      const created = '1111111';
      const cheWorkspace = new CheWorkspaceBuilder()
        .withAttributes({
          created,
        } as che.WorkspaceAttributes)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.created.toString()).toEqual(created);
    });

    it('should return timestamp of updating', () => {
      const updated = '2222222';
      const cheWorkspace = new CheWorkspaceBuilder()
        .withAttributes({
          updated,
        } as che.WorkspaceAttributes)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.updated.toString()).toEqual(updated);
    });

    it('should return status', () => {
      const status = 'STARTING';
      const cheWorkspace = new CheWorkspaceBuilder()
        .withStatus(status)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.status).toEqual(status);
    });

    it('should return ideUrl', () => {
      const ideUrl = 'my/ide/url';
      const runtime = CHE_RUNTIME_STUB;
      runtime.machines['theia-ide'].servers.theia.url = ideUrl;
      const cheWorkspace = new CheWorkspaceBuilder()
        .withRuntime(runtime)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.ideUrl).toEqual(ideUrl);
    });

    it('should return storage type', () => {
      const devfile = CHE_DEVFILE_STUB;
      devfile.attributes = {
        persistVolumes: 'false',
        asyncPersist: 'false',
      };
      const cheWorkspace = new CheWorkspaceBuilder()
        .withDevfile(devfile)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.storageType).toEqual(StorageTypeTitle.ephemeral.toLowerCase());
    });

    it('should return devfile', () => {
      const devfile = CHE_DEVFILE_STUB;
      devfile.attributes = {
        persistVolumes: 'true',
        asyncPersist: 'false',
      };
      const cheWorkspace = new CheWorkspaceBuilder()
        .withDevfile(devfile)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.devfile).toMatchObject(devfile);
    });

    it('should return list of project names', () => {
      const projects = [{
        name: 'My first project',
        source: {
          type: 'git',
          location: 'first/project/location',
        },
      }, {
        name: 'My second project',
        source: {
          type: 'git',
          location: 'second/project/location',
        },
      }];
      const cheWorkspace = new CheWorkspaceBuilder()
        .withProjects(projects)
        .build();
      const workspace = convertWorkspace(cheWorkspace);
      expect(workspace.projects).toEqual([projects[0].name, projects[1].name]);
    });

  });

  describe('for Dev workspace', () => {

    it('should return reference to the workspace', () => {
      const devWorkspace = new DevWorkspaceBuilder().build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.ref).toMatchObject(devWorkspace);
    });

    it('should return ID', () => {
      const id = '1234asdf';
      const devWorkspace = new DevWorkspaceBuilder()
        .withId(id)
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.id).toEqual(id);
    });

    it('should return name', () => {
      const name = 'wksp-1234';
      const devWorkspace = new DevWorkspaceBuilder()
        .withName(name)
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.name).toEqual(name);
    });

    it('should return namespace', () => {
      const namespace = 'test-namespace';
      const devWorkspace = new DevWorkspaceBuilder()
        .withNamespace(namespace)
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.namespace).toEqual(namespace);
    });

    it('should return infrastructure namespace', () => {
      const infrastructureNamespace = 'infrastructure-namespace';
      const devWorkspace = new DevWorkspaceBuilder()
        .withNamespace(infrastructureNamespace)
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.infrastructureNamespace).toEqual(infrastructureNamespace);
    });

    it('should return timestamp of creating', () => {
      const created = '1111111';
      const devWorkspace = new DevWorkspaceBuilder()
        .withMetadata({
          creationTimestamp: created,
        } as IDevWorkspace['metadata'])
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.created.toString()).toEqual(created);
    });

    it('should return timestamp of updating', () => {
      const updated = '2222222';
      const devWorkspace = new DevWorkspaceBuilder()
        .withMetadata({
          creationTimestamp: updated,
        } as IDevWorkspace['metadata'])
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.updated.toString()).toEqual(updated);
    });

    it('should return status', () => {
      const status = 'STARTING';
      const devWorkspace = new DevWorkspaceBuilder()
        .withStatus(status)
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.status).toEqual(status);
    });

    it('should return ideUrl', () => {
      const ideUrl = 'my/ide/url';
      const devWorkspace = new DevWorkspaceBuilder()
        .withIdeUrl(ideUrl)
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.ideUrl).toEqual(ideUrl);
    });

    it('should return storage type', () => {
      const devWorkspace = new DevWorkspaceBuilder()
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.storageType).toEqual(StorageTypeTitle.persistent.toLowerCase());
    });

    it('should return devfile', () => {
      const devfile = {
        schemaVersion: '2.1.0',
        metadata: {
          name: 'my-wksp',
          namespace: 'my-namespace',
        }
      };
      const devWorkspace = new DevWorkspaceBuilder()
        .withName('my-wksp')
        .withNamespace('my-namespace')
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.devfile).toMatchObject(devfile);
    });

    it('should return list of project names', () => {
      const projects = [{
        name: 'My first project',
        git: {
          remotes: {
            origin: 'first/project/location',
          }
        },
      }, {
        name: 'My second project',
        git: {
          remotes: {
            origin: 'second/project/location',
          }
        },
      }];
      const devWorkspace = new DevWorkspaceBuilder()
        .withProjects(projects)
        .build();
      const workspace = convertWorkspace(devWorkspace);
      expect(workspace.projects).toEqual([projects[0].name, projects[1].name]);
    });

  });

});
