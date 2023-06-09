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

export type EnvironmentType = 'production' | 'development';
export type Environment = {
  type: EnvironmentType;
  server?: string;
};
export type ProdEnvironment = {
  type: 'production';
};
export type DevEnvironment = {
  type: 'development';
  server: string;
};

export function getEnvironment(): Environment {
  const env: Environment = {
    type:
      (process && process.env && (process.env.ENVIRONMENT as EnvironmentType)) === 'development'
        ? 'development'
        : 'production',
  };
  return env;
}
export function isDevEnvironment(env: Environment): env is DevEnvironment {
  if (env.type === 'development') {
    return true;
  }
  return false;
}
export function isProdEnvironment(env: Environment): env is ProdEnvironment {
  return isDevEnvironment(env) === false;
}
