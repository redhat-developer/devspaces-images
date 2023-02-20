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

import { FakeStoreBuilder } from '../../../store/__mocks__/storeBuilder';
import { DevWorkspaceBuilder } from '../../../store/__mocks__/devWorkspaceBuilder';
import SessionStorageService, { SessionStorageKey } from '../../session-storage';
import { WorkspaceRunningError, WorkspaceStoppedDetector } from '../workspaceStoppedDetector';
import { constructWorkspace } from '../../workspace-adapter';
import { IssueType } from '../issuesReporter';

describe('WorkspaceStoppedDetector', () => {
  describe('checkWorkspaceStopped()', () => {
    it('should return correct workspace', () => {
      const mainUrlPath = '/workspaced5858247cc74458d/';
      const differentMainUrlPath = '/workspace27f154b1f05f481e/';
      SessionStorageService.update(SessionStorageKey.ORIGINAL_LOCATION_PATH, mainUrlPath);

      const devWorkspaces = [
        new DevWorkspaceBuilder()
          .withId('dev-wksp-0')
          .withName('dev-wksp-0')
          .withNamespace('user-dev')
          .withStatus({ mainUrl: mainUrlPath })
          .build(),
        new DevWorkspaceBuilder()
          .withId('dev-wksp-1')
          .withName('dev-wksp-1')
          .withNamespace('user-dev')
          .withStatus({ mainUrl: differentMainUrlPath })
          .build(),
      ];

      const store = new FakeStoreBuilder().withDevWorkspaces({ workspaces: devWorkspaces }).build();

      const workspace = new WorkspaceStoppedDetector().checkWorkspaceStopped(store.getState());

      expect(workspace).toBeDefined();
      expect(workspace?.id).toBe('dev-wksp-0');
    });

    it('should return no workspace if there is no url path stored in session storage', () => {
      const mainUrlPath = '/workspaced5858247cc74458d/';
      const devWorkspaceId = 'dev-wksp-0';
      const devWorkspaces = [
        new DevWorkspaceBuilder()
          .withId(devWorkspaceId)
          .withName('dev-wksp-0')
          .withNamespace('user-dev')
          .withStatus({ mainUrl: mainUrlPath })
          .build(),
      ];

      const store = new FakeStoreBuilder().withDevWorkspaces({ workspaces: devWorkspaces }).build();

      const workspace = new WorkspaceStoppedDetector().checkWorkspaceStopped(store.getState());

      expect(workspace).toBeUndefined();
    });

    it('should return no workspace due to different mainurl', () => {
      const mainUrlPath = '/workspaced5858247cc74458d/';
      const differentMainUrlPath = '/workspace27f154b1f05f481e/';
      SessionStorageService.update(SessionStorageKey.ORIGINAL_LOCATION_PATH, mainUrlPath);

      const devWorkspaceId = 'dev-wksp-0';
      const devWorkspaces = [
        new DevWorkspaceBuilder()
          .withId(devWorkspaceId)
          .withName('dev-wksp-0')
          .withNamespace('user-dev')
          .withStatus({ mainUrl: differentMainUrlPath })
          .build(),
      ];

      const store = new FakeStoreBuilder().withDevWorkspaces({ workspaces: devWorkspaces }).build();

      const workspace = new WorkspaceStoppedDetector().checkWorkspaceStopped(store.getState());

      expect(workspace).toBeUndefined();
    });

    it('should throw error if matching workspace exists, but it is running', () => {
      const mainUrlPath = '/workspaced5858247cc74458d/';
      SessionStorageService.update(SessionStorageKey.ORIGINAL_LOCATION_PATH, mainUrlPath);

      const devWorkspace = new DevWorkspaceBuilder()
        .withId('dev-wksp-0')
        .withName('dev-wksp-0')
        .withNamespace('user-dev')
        .withStatus({ mainUrl: mainUrlPath, phase: 'RUNNING' })
        .build();
      devWorkspace.spec.started = true;

      const store = new FakeStoreBuilder()
        .withDevWorkspaces({ workspaces: [devWorkspace] })
        .build();
      const checkWorkspaceStopped = () => {
        new WorkspaceStoppedDetector().checkWorkspaceStopped(store.getState());
      };

      expect(checkWorkspaceStopped).toThrow(WorkspaceRunningError);
    });
  });

  it('should throw error if matching workspace exists, but it is starting', () => {
    const mainUrlPath = '/workspaced5858247cc74458d/universal-developer-image/3100/';
    SessionStorageService.update(SessionStorageKey.ORIGINAL_LOCATION_PATH, mainUrlPath);

    const devWorkspace = new DevWorkspaceBuilder()
      .withId('workspaced5858247cc74458d')
      .withName('dev-wksp-0')
      .withNamespace('user-dev')
      .withStatus({ mainUrl: mainUrlPath, phase: 'RUNNING' })
      .build();
    devWorkspace.spec.started = true;

    const store = new FakeStoreBuilder().withDevWorkspaces({ workspaces: [devWorkspace] }).build();
    const checkWorkspaceStopped = () => {
      new WorkspaceStoppedDetector().checkWorkspaceStopped(store.getState());
    };

    expect(checkWorkspaceStopped).toThrow(WorkspaceRunningError);
  });

  describe('getWorkspaceStoppedError()', () => {
    it('should return error with devworkspace status message', () => {
      const issueType = 'workspaceStoppedError';
      const message = 'Container failing-container has state ImagePullBackOff';

      const devWorkspace = new DevWorkspaceBuilder()
        .withId('dev-wksp-0')
        .withName('dev-wksp-0')
        .withNamespace('user-dev')
        .withStatus({
          mainUrl: '/workspaced5858247cc74458d/',
          phase: 'FAILED',
          message,
        })
        .build();

      const workspace = constructWorkspace(devWorkspace);
      const error = new WorkspaceStoppedDetector().getWorkspaceStoppedError(workspace, issueType);
      expect(error.message).toBe(message);
    });

    it('should return error without a message', () => {
      const issueTypes: IssueType[] = [
        'workspaceInactive',
        'workspaceRunTimeout',
        'workspaceStopped',
      ];

      const devWorkspace = new DevWorkspaceBuilder()
        .withId('dev-wksp-0')
        .withName('dev-wksp-0')
        .withNamespace('user-dev')
        .withStatus({
          mainUrl: '/workspaced5858247cc74458d/',
        })
        .build();

      const workspace = constructWorkspace(devWorkspace);
      issueTypes.forEach(issueType => {
        const error = new WorkspaceStoppedDetector().getWorkspaceStoppedError(workspace, issueType);
        expect(error.message).toBeFalsy();
      });
    });

    it('should throw error if workspace is running', () => {
      const devWorkspace = new DevWorkspaceBuilder()
        .withId('dev-wksp-0')
        .withName('dev-wksp-0')
        .withNamespace('user-dev')
        .withStatus({
          mainUrl: '/workspaced5858247cc74458d/',
          phase: 'RUNNING',
        })
        .build();
      devWorkspace.spec.started = true;
      const workspace = constructWorkspace(devWorkspace);
      const checkWorkspaceStopped = () => {
        new WorkspaceStoppedDetector().getWorkspaceStoppedError(workspace, 'workspaceInactive');
      };

      expect(checkWorkspaceStopped).toThrow(WorkspaceRunningError);
    });
  });

  describe('getWorkspaceStoppedIssueType()', () => {
    it("should return 'workspaceInactive'", () => {
      const devWorkspace = new DevWorkspaceBuilder()
        .withId('dev-wksp-0')
        .withName('dev-wksp-0')
        .withNamespace('user-dev')
        .withStatus({
          mainUrl: '/workspaced5858247cc74458d/',
        })
        .build();

      devWorkspace.metadata.annotations = { 'controller.devfile.io/stopped-by': 'inactivity' };

      const workspace = constructWorkspace(devWorkspace);
      const issueType = new WorkspaceStoppedDetector().getWorkspaceStoppedIssueType(workspace);
      expect(issueType).toBe('workspaceInactive');
    });

    it("should return 'workspaceRunTimeout'", () => {
      const devWorkspace = new DevWorkspaceBuilder()
        .withId('dev-wksp-0')
        .withName('dev-wksp-0')
        .withNamespace('user-dev')
        .withStatus({
          mainUrl: '/workspaced5858247cc74458d/',
        })
        .build();

      devWorkspace.metadata.annotations = { 'controller.devfile.io/stopped-by': 'run-timeout' };

      const workspace = constructWorkspace(devWorkspace);
      const issueType = new WorkspaceStoppedDetector().getWorkspaceStoppedIssueType(workspace);
      expect(issueType).toBe('workspaceRunTimeout');
    });

    it("should return 'workspaceStoppedError'", () => {
      const message = 'Container failing-container has state ImagePullBackOff';
      const devWorkspace = new DevWorkspaceBuilder()
        .withId('dev-wksp-0')
        .withName('dev-wksp-0')
        .withNamespace('user-dev')
        .withStatus({
          mainUrl: '/workspaced5858247cc74458d/',
          phase: 'FAILED',
          message,
        })
        .build();

      const workspace = constructWorkspace(devWorkspace);
      const issueType = new WorkspaceStoppedDetector().getWorkspaceStoppedIssueType(workspace);
      expect(issueType).toBe('workspaceStoppedError');
    });

    it("should return 'workspaceStopped'", () => {
      const devWorkspace = new DevWorkspaceBuilder()
        .withId('dev-wksp-0')
        .withName('dev-wksp-0')
        .withNamespace('user-dev')
        .withStatus({
          mainUrl: '/workspaced5858247cc74458d/',
        })
        .build();

      const workspace = constructWorkspace(devWorkspace);
      const issueType = new WorkspaceStoppedDetector().getWorkspaceStoppedIssueType(workspace);
      expect(issueType).toBe('workspaceStopped');
    });

    it('should throw error if workspace is running', () => {
      const devWorkspace = new DevWorkspaceBuilder()
        .withId('dev-wksp-0')
        .withName('dev-wksp-0')
        .withNamespace('user-dev')
        .withStatus({
          mainUrl: '/workspaced5858247cc74458d/',
          phase: 'RUNNING',
        })
        .build();
      devWorkspace.spec.started = true;
      const workspace = constructWorkspace(devWorkspace);
      const checkWorkspaceStopped = () => {
        new WorkspaceStoppedDetector().getWorkspaceStoppedIssueType(workspace);
      };

      expect(checkWorkspaceStopped).toThrow(WorkspaceRunningError);
    });
  });
});
