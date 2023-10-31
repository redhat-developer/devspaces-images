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

import { format, formatDistanceToNow } from 'date-fns';

export type Ms = number;

export function formatDate(date: Ms | Date): string {
  return format(date, 'MMM dd, h:mm aaaa');
}

export function formatRelativeDate(date: Ms | Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Returns formatted date. If the date is within an hour, it will be formatted as relative date.
 */
export function getFormattedDate(date?: Ms | Date): string {
  if (date === undefined) {
    return '';
  }

  const dateMs = new Date(date).getTime();
  const nowMs = Date.now();

  let formattedDate = '';
  // show relative date if distance is withing an hour
  if (nowMs - dateMs < 60 * 60 * 1000) {
    formattedDate = formatRelativeDate(dateMs);
  } else {
    formattedDate = formatDate(dateMs);
  }

  return formattedDate;
}
