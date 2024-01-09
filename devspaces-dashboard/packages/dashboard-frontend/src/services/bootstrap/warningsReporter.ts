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

import { injectable } from 'inversify';

export type Warning = {
  key: string;
  title: string;
};

@injectable()
export class WarningsReporterService {
  private warnings: Warning[] = [];

  public get hasWarning(): boolean {
    return this.warnings.length !== 0;
  }

  public registerWarning(key: string, title: string): void {
    this.warnings.push({ key, title });
  }

  public reportAllWarnings(): Warning[] {
    return this.warnings;
  }

  public clearWarnings(): void {
    this.warnings = [];
  }
}
