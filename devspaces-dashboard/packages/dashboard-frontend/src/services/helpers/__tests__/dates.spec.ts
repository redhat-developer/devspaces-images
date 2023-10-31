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

import { formatDate, formatRelativeDate, getFormattedDate } from '@/services/helpers/dates';

jest.mock('date-fns', () => {
  return {
    format: jest.fn(),
    formatDistanceToNow: jest.fn(),
  };
});

describe('dates', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('formatDate', () => {
    const date = new Date('2000-11-01T00:00:00.000Z');
    formatDate(date);
    expect(format).toHaveBeenCalledWith(date, 'MMM dd, h:mm aaaa');
  });

  test('formatRelativeDate', () => {
    const date = new Date('2000-11-01T00:00:00.000Z');
    formatRelativeDate(date);
    expect(formatDistanceToNow).toHaveBeenCalledWith(date, { addSuffix: true });
  });

  describe('getFormattedDate', () => {
    it('should call `formatDistanceToNow` (5 seconds ago)', () => {
      const date = new Date(Date.now() - 5_000);
      getFormattedDate(date);
      expect(formatDistanceToNow).toHaveBeenCalled();
      expect(format).not.toHaveBeenCalled();
    });

    it('should return non-relative date', () => {
      const date = new Date('2000-11-01T00:00:00.000Z');
      getFormattedDate(date);
      expect(formatDistanceToNow).not.toHaveBeenCalled();
      expect(format).toHaveBeenCalled();
    });
  });
});
