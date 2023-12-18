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

import axios, { AxiosInstance } from 'axios';

class CheAxiosInstance {
  private static instance: CheAxiosInstance;
  private readonly axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({ timeout: 15000 });
  }

  public static getInstance(): CheAxiosInstance {
    if (!CheAxiosInstance.instance) {
      CheAxiosInstance.instance = new CheAxiosInstance();
    }

    return CheAxiosInstance.instance;
  }

  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export function getAxiosInstance(): AxiosInstance {
  return CheAxiosInstance.getInstance().getAxiosInstance();
}
