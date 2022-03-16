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

export type BrandingData = {
  title: string;
  name: string;
  productVersion?: string;
  links?: Link[];
  logoTextFile: string;
  logoFile: string;
  docs: BrandingDocs;
  configuration: BrandingConfiguration;
  header?: BrandingHeader;
};

export type BrandingHeader = {
  warning: string;
};

export type BrandingDocs = {
  devfile: string;
  workspace: string;
  general: string;
  certificate: string;
  faq?: string;
  storageTypes: string;
  webSocketTroubleshooting: string;
};

export type BrandingConfiguration = {
  cheCliTool: string;
  prefetch?: PrefetchConfiguration;
};

export type PrefetchConfiguration = {
  cheCDN?: string;
  resources: string[];
};

export type Link = {
  text: string;
  href: string;
};

export enum TogglableFeature {
  WORKSPACE_SHARING = 'workspaceSharing',
  KUBERNETES_NAMESPACE_SELECTOR = 'kubernetesNamespaceSelector',
}

export const BRANDING_DEFAULT: BrandingData = {
  title: 'Eclipse Che',
  name: 'Eclipse Che',
  logoFile: 'che-logo.svg',
  logoTextFile: 'che-logo-text.svg',
  // the following commented lines can't be overridden
  // in case customization is needed these files should be defined in
  // favicon: '/assets/branding/favicon.ico',
  // loader: '/assets/branding/loader.svg',
  links: [
    {
      text: 'Make a wish',
      href: 'mailto:che-dev@eclipse.org',
    },
    {
      text: 'Documentation',
      href: 'https://www.eclipse.org/che/docs/che-7',
    },
    {
      text: 'Community',
      href: 'https://www.eclipse.org/che/',
    },
  ],
  docs: {
    devfile: 'https://www.eclipse.org/che/docs/che-7/end-user-guide/authoring-devfiles/',
    workspace: 'https://www.eclipse.org/che/docs/che-7/workspaces-overview/',
    certificate: 'https://www.eclipse.org/che/docs/che-7/importing-certificates-to-browsers/',
    general: 'https://www.eclipse.org/che/docs/che-7',
    storageTypes: 'https://www.eclipse.org/che/docs/che-7/configuring-storage-types/',
    webSocketTroubleshooting:
      'https://www.eclipse.org/che/docs/che-7/troubleshooting-network-problems/#troubleshooting-websocket-secure-connections_troubleshooting-network-problems',
  },
  configuration: {
    cheCliTool: 'chectl',
  },
};
