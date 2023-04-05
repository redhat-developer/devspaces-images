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

export interface ClusterInfo {
  applications: ApplicationInfo[];
}

export enum ApplicationId {
  CLUSTER_CONSOLE = 'cluster-console',
}

export interface ApplicationInfo {
  url: string;
  title: string;
  icon: string;
  group?: string;
  id?: ApplicationId;
}
