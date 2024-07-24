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

import { helpers } from '@eclipse-che/common';
import { Location } from 'history';

export interface FactoryLocation {
  readonly searchParams: URLSearchParams;
  readonly path: string;
  readonly isHttpLocation: boolean;
  readonly isSshLocation: boolean;
  readonly toString: () => string;
}

export class FactoryLocationAdapter implements FactoryLocation {
  private readonly fullPathUrl: string | undefined;
  private readonly sshLocation: string | undefined;
  private readonly search: URLSearchParams;
  private readonly pathname: string;

  constructor(href: string) {
    href = href.trim();
    if (!href.includes('?')) {
      href = href.replace('&', '?');
    }
    const [pathname, search] = href.split('?');
    const sanitizedLocation = helpers.sanitizeLocation({ search, pathname } as Location);

    this.pathname = sanitizedLocation.pathname;
    this.search = new window.URLSearchParams(sanitizedLocation.search);

    if (FactoryLocationAdapter.isHttpLocation(sanitizedLocation.pathname)) {
      this.fullPathUrl = sanitizedLocation.pathname;
      if (sanitizedLocation.search) {
        this.fullPathUrl += sanitizedLocation.search;
      }
    } else if (FactoryLocationAdapter.isSshLocation(sanitizedLocation.pathname)) {
      this.sshLocation = sanitizedLocation.pathname;
      if (sanitizedLocation.search) {
        this.sshLocation += sanitizedLocation.search;
      }
    } else {
      throw new Error(`Unsupported factory location: "${href}"`);
    }
  }

  public static isHttpLocation(href: string): boolean {
    return /^(https?:\/\/.)[-a-zA-Z0-9@:%._+~#=]{2,}\b([-a-zA-Z0-9@:%_+.~#?&/={}, ]*)$/.test(href);
  }

  public static isSshLocation(href: string): boolean {
    return (
      !this.isHttpLocation(href) &&
      /^(ssh:\/\/)?(?:([a-z_][a-z0-9_]{2,})@)?[^:]+:.*\/[^/]+$/.test(href)
    );
  }

  get searchParams(): URLSearchParams {
    return this.search;
  }

  get path(): string {
    return this.pathname;
  }

  get isHttpLocation(): boolean {
    return this.fullPathUrl !== undefined;
  }

  get isSshLocation(): boolean {
    return this.sshLocation !== undefined;
  }

  public toString(): string {
    const search = this.search.toString();
    if (search) {
      return this.pathname + '?' + search;
    }
    return this.pathname;
  }
}
