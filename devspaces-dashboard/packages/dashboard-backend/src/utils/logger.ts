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

import { FastifyInstance } from 'fastify';
import { LevelWithSilent, pino } from 'pino';
import pretty from 'pino-pretty';

export const stream = pretty({
  levelFirst: true,
  colorize: true,
  ignore: 'pid,hostname',
  translateTime: 'HH:MM:ss Z',
  // singleLine: true,
});

export const logger = pino(stream);

const logLevels = [
  'debug',
  'error',
  'fatal',
  'info',
  'silent',
  'trace',
  'warn',
] as LevelWithSilent[];

export function updateLogLevel(logLevel: LevelWithSilent, server: FastifyInstance): void;
export function updateLogLevel(logLevel: string, server: FastifyInstance): void;
export function updateLogLevel(logLevel: LevelWithSilent | string, server: FastifyInstance): void {
  const level = logLevel.toLowerCase();
  if (isLevelWithSilent(level)) {
    console.log('[logger] logLevel:', logLevel);
    logger.level = level;
    server.log.level = level;
  }
}

function isLevelWithSilent(logLevel: string): logLevel is LevelWithSilent {
  return logLevels.includes(logLevel as LevelWithSilent);
}
