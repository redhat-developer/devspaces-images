/**********************************************************************
 * Copyright (c) 2022 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

/* eslint-disable header/header */

import { Units } from './constants';

export function convertToBytes(unit: string | undefined): number {
  if (!unit) {
    return 0;
  }
  if (unit.substring(unit.length - 2).toUpperCase() === 'MI') {
    return fromMebibytes(parseInt(unit.substring(0, unit.length - 2)));
  } else if (unit.substring(unit.length - 2).toUpperCase() === 'KI') {
    return fromKibibytes(parseInt(unit.substring(0, unit.length - 2)));
  } else if (unit.substring(unit.length - 2).toUpperCase() === 'GI') {
    return fromGibibytes(parseInt(unit.substring(0, unit.length - 2)));
  } else if (unit.substring(unit.length - 1).toUpperCase() === 'M') {
    return fromMegabytes(parseInt(unit.substring(0, unit.length - 1)));
  } else if (unit.substring(unit.length - 1).toUpperCase() === 'K') {
    return fromKilobytes(parseInt(unit.substring(0, unit.length - 1)));
  } else if (unit.substring(unit.length - 1).toUpperCase() === 'G') {
    return fromGigabytes(parseInt(unit.substring(0, unit.length - 1)));
  } else {
    return parseInt(unit);
  }
}

export function fromKilobytes(unit: number): number {
  return unit * Units.K;
}

export function fromMegabytes(unit: number): number {
  return unit * Units.M;
}

export function fromGigabytes(unit: number): number {
  return unit * Units.G;
}

export function fromMebibytes(unit: number): number {
  return unit * Units.MI;
}

export function fromGibibytes(unit: number): number {
  return unit * Units.GI;
}

export function fromKibibytes(unit: number): number {
  return unit * Units.KI;
}

export function convertToMilliCPU(unit: string | undefined): number {
  if (!unit) {
    return 0;
  }

  if (unit.substring(unit.length - 1).toUpperCase() === 'M') {
    return parseInt(unit.substring(0, unit.length - 1));
  } else if (unit.substring(unit.length - 1).toUpperCase() === 'N') {
    const value = parseInt(unit.substring(0, unit.length - 1));
    // convert nanoCPU to miliCPU
    return Math.round(value / 1000 / 1000);
  } else {
    return parseInt(unit) * 1000;
  }
}
