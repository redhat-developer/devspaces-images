//
// Copyright (c) 2012-2019 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package utf8stream

// This package is aimed to ensure that given data is valid utf-8.
// It processes incoming stream and makes changes if any invalid data found
// by replacing invalid bytes with placeholder symbols.
// Functionality of this package is designed to be used before sending text content
// via rpc channel which specification requires valid utf-8 encoding.
