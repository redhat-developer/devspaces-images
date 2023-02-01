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

interface Disposable {
  /**
   * Dispose this object.
   */
  dispose(): void;
}

export class DisposableCollection implements Disposable {
  private disposables: Disposable[] = [];

  dispose(): void {
    while (this.disposables.length > 0) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  push(disposable: Disposable): Disposable {
    const disposables = this.disposables;
    disposables.push(disposable);
    return {
      dispose(): void {
        const index = disposables.indexOf(disposable);
        if (index !== -1) {
          disposables.splice(index, 1);
        }
      },
    };
  }
}
