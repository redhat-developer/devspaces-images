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

import { FactoryResolver, FactoryResolverScmInfo } from '../../services/helpers/types';

export class FactoryResolverBuilder {
  private factoryResolver = {
    v: '4.0',
  } as FactoryResolver;

  withDevfile(devfile: api.che.workspace.devfile.Devfile): FactoryResolverBuilder {
    this.factoryResolver.devfile = devfile;
    return this;
  }

  withSource(source: string): FactoryResolverBuilder {
    this.factoryResolver.source = source;
    return this;
  }

  withLocation(location: string): FactoryResolverBuilder {
    this.factoryResolver.location = location;
    return this;
  }

  withScmInfo(scmInfo: FactoryResolverScmInfo): FactoryResolverBuilder {
    this.factoryResolver['scm_info'] = scmInfo;
    return this;
  }

  build(): FactoryResolver {
    return this.factoryResolver;
  }
}
