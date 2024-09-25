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

import React from 'react';
import { useNavigate } from 'react-router-dom';

import GetStarted from '@/pages/GetStarted';

export default function GetStartedContainer(): React.ReactElement {
  const navigate = useNavigate();

  return <GetStarted navigate={navigate} />;
}
