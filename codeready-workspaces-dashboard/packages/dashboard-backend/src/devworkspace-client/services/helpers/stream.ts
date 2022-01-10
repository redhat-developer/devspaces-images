/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { Writable } from 'stream';

export class StdStream extends Writable {
  private _chunks;

  constructor() {
    super();
    this._chunks = '';
  }

  _write(chunk: string, encoding: BufferEncoding, done: (error?: Error | null) => void): void {
    this._chunks += chunk.toString();
    done();
  }

  get chunks() {
    return this._chunks.trim();
  }
}
