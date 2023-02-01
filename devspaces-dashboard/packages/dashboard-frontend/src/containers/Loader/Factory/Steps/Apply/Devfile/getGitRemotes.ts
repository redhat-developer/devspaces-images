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

import common from '@eclipse-che/common';

export interface GitRemote {
  name: string;
  url: string;
}

/**
 * Returns parsed Git remotes given a string in one of the following
 * formats:
 *
 * 1. Explicit name and URL
 * {{origin,https://git...},{upstream,https://git...},...}
 *
 * 2. URLs only, name is implicit: first is origin, second is upstream, subsequent are fork1, fork2
 * {https://git...,https://git...,...}
 *
 * @param remotes input string to parse
 * @returns parsed array of Git remotes
 */
export function getGitRemotes(remotes: string): GitRemote[] {
  if (remotes.length === 0) {
    return [];
  }
  const remotesArray = parseRemotes(remotes);
  if (Array.isArray(remotesArray[0])) {
    return parseNameAndUrls(remotesArray, remotes);
  }
  return parseUrls(remotesArray, remotes);
}

function parseRemotes(remotes: string): string[] {
  try {
    return JSON.parse(sanitizeValue(remotes));
  } catch (e) {
    throw `Unable to parse remotes attribute. ${common.helpers.errors.getMessage(e)}`;
  }
}

/**
 * Replaces braces ({}) with square brackets ([]) and adds
 * quotation marks (") around strings
 * @param str
 * @returns string representing an array
 */
export function sanitizeValue(str: string): string {
  return (
    str
      .replace(/\s/g, '')
      .replace(/{/g, '[')
      .replace(/}/g, ']')
      /* eslint-disable no-useless-escape */
      // replace '[<string>' with '["<char>'
      .replace(/(\[([^\["]))/g, '["$2')
      // replace '<string>]' with '<char>"]'
      .replace(/(([^\]"])\])/g, '$2"]')
      // replace '<string>,<string>' with '<char>","<char>'
      .replace(/(([^\]"]),([^\["]))/g, '$2","$3')
    /* eslint-enable no-useless-escape */
  );
}

function parseNameAndUrls(remotesArray, remotesString): GitRemote[] {
  const remotes: GitRemote[] = [];
  remotesArray.forEach(value => {
    if (!Array.isArray(value) || value.length !== 2) {
      throw `Malformed remotes provided: ${remotesString}`;
    }
    remotes.push({ name: value[0], url: value[1] });
  });
  return remotes;
}

function parseUrls(remotesArray, remotesString): GitRemote[] {
  const remotes: GitRemote[] = [];

  remotesArray.forEach((value, i) => {
    if (typeof value !== 'string') {
      throw `Malformed remotes provided: ${remotesString}`;
    }

    let name;
    if (i === 0) {
      name = 'origin';
    } else if (i === 1) {
      name = 'upstream';
    } else {
      name = `fork${i - 1}`;
    }
    remotes.push({ name, url: value });
  });
  return remotes;
}
