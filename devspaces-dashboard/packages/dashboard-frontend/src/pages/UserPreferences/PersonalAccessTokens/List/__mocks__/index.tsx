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

import React from 'react';
import { Props } from '..';

export class PersonalAccessTokenList extends React.Component<Props> {
  render() {
    const { isDisabled, tokens, onAddToken, onEditToken, onDeleteTokens } = this.props;
    return (
      <div data-testid="token-list">
        {tokens.map(token => (
          <div data-testid="token-row" key={token.tokenName}>
            <span>{token.tokenName}</span>
            <button
              data-testid="edit-token"
              disabled={isDisabled}
              onClick={() => onEditToken(token)}
            >
              Edit Token
            </button>
            <button
              data-testid="delete-token"
              disabled={isDisabled}
              onClick={() => onDeleteTokens([token])}
            >
              Delete Token
            </button>
          </div>
        ))}
        <button
          data-testid="delete-all-tokens"
          disabled={isDisabled}
          onClick={() => onDeleteTokens(tokens)}
        >
          Delete
        </button>
        <button data-testid="add-token" disabled={isDisabled} onClick={() => onAddToken()}>
          Add Token
        </button>
      </div>
    );
  }
}
