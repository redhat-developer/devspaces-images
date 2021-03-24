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

package line_buffer

// This component was implemented to have ability to restore exec output.
// Clint side should have ability to reconnect to the created exec
// and get previous output.
// This package it's implementation of ring buffer to store exec output
// with limited amount of lines. This limit is defined like max ring buffer size.
// If exec spawns output more than ring buffer size than we rewrite previously
// stored output by ring.
