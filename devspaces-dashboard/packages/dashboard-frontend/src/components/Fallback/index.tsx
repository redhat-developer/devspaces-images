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

import { Spinner, spinnerSize } from '@patternfly/react-core';
import React from 'react';

const Fallback = (
  <div style={{ height: '100%', textAlign: 'center', opacity: '0.5' }}>
    <Spinner
      data-testid="fallback-spinner"
      size={spinnerSize.xl}
      style={{ top: 'calc(50% - 18px)' }}
    />
  </div>
);

export default Fallback;
