/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

declare module 'multi-ini' {
  declare class Parser {
    constructor(options?: Record<string, unknown>);
    options: unknown;
    handlers: ((ctx: unknown, line: unknown) => unknown)[];
    parse(lines: unknown): Record<string, unknown>;
    isSection(line: unknown): unknown;
    getSection(line: unknown): unknown;
    getParentSection(line: unknown): unknown;
    isInheritedSection(line: unknown): boolean;
    isComment(line: unknown): unknown;
    isSingleLine(line: unknown): boolean;
    isMultiLine(line: unknown): boolean;
    isMultiLineEnd(line: unknown): boolean;
    isArray(line: unknown): unknown;
    assignValue(element: unknown, keys: unknown, value: unknown): unknown;
    applyFilter(value: unknown): unknown;
    getKeyValue(line: unknown): {
      key: unknown;
      value: unknown;
      status: number;
    };
    getMultiKeyValue(line: unknown): {
      key: unknown;
      value: unknown;
    };
    getMultiLineEndValue(line: unknown): {
      value: unknown;
      status: number;
    };
    getArrayKey(line: unknown): unknown;
    handleMultiLineStart(ctx: unknown, line: unknown): boolean;
    handleMultiLineEnd(ctx: unknown, line: unknown): boolean;
    handleMultiLineAppend(ctx: unknown, line: unknown): boolean;
    handleComment(ctx: unknown, line: unknown): unknown;
    handleSection(ctx: unknown, line: unknown): boolean;
    handleSingleLine(ctx: unknown, line: unknown): boolean;
    createSection(ctx: unknown, section: unknown): void;
  }

  declare class Serializer {
    constructor(options?: Record<string, unknown>);
    options: unknown;
    needToBeQuoted(value: unknown): boolean;
    serialize(content: unknown): string;
    serializeContent(content: unknown, path: unknown): string;
  }
}
