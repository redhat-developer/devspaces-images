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

import { FactoryResolver, FactoryResolverScmInfo } from '@/services/helpers/types';
import { che } from '@/services/models';

export class FactoryResolverBuilder {
  private factoryResolver = {
    v: '4.0',
  } as FactoryResolver;

  withDevfile(devfile: che.api.workspace.devfile.Devfile): FactoryResolverBuilder {
    this.factoryResolver.devfile = devfile;
    return this;
  }

  withSource(source: string): FactoryResolverBuilder {
    this.factoryResolver.source = source;
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
