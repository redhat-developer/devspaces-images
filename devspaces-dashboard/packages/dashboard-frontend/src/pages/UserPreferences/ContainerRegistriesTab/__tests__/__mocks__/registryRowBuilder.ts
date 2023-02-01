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

import { RegistryEntry } from '../../../../../store/DockerConfig/types';

export class FakeRegistryBuilder {
  private registry: RegistryEntry = { url: '', password: '', username: '' };

  public withUrl(url: string): FakeRegistryBuilder {
    this.registry.url = url;
    return this;
  }

  public withUsername(username: string): FakeRegistryBuilder {
    this.registry.username = username;
    return this;
  }

  public withPassword(password: string): FakeRegistryBuilder {
    this.registry.password = password;
    return this;
  }

  public build(): RegistryEntry {
    return this.registry;
  }
}
