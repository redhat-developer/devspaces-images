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

import 'reflect-metadata';
import { Container } from 'inversify';
import getDecorators from 'inversify-inject-decorators';
import { Debounce } from './services/helpers/debounce';
import { CheWorkspaceClient } from './services/workspace-client/cheworkspace/cheWorkspaceClient';
import { AppAlerts } from './services/alerts/appAlerts';
import { IssuesReporterService } from './services/bootstrap/issuesReporter';
import { DevWorkspaceClient } from './services/workspace-client/devworkspace/devWorkspaceClient';
import { DevWorkspaceDefaultPluginsHandler } from './services/workspace-client/devworkspace/DevWorkspaceDefaultPluginsHandler';
import { WorkspaceStoppedDetector } from './services/bootstrap/workspaceStoppedDetector';
import { WebsocketClient } from './services/dashboard-backend-client/websocketClient';

const container = new Container();
const { lazyInject } = getDecorators(container);

container.bind(IssuesReporterService).toSelf().inSingletonScope();
container.bind(Debounce).toSelf();
container.bind(WebsocketClient).toSelf().inSingletonScope();
container.bind(CheWorkspaceClient).toSelf().inSingletonScope();
container.bind(DevWorkspaceClient).toSelf().inSingletonScope();
container.bind(AppAlerts).toSelf().inSingletonScope();
container.bind(DevWorkspaceDefaultPluginsHandler).toSelf().inSingletonScope();
container.bind(WorkspaceStoppedDetector).toSelf().inSingletonScope();

export { container, lazyInject };
