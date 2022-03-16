//
// Copyright (c) 2019-2020 Red Hat, Inc.
// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/
//
// SPDX-License-Identifier: EPL-2.0
//
// Contributors:
//   Red Hat, Inc. - initial API and implementation
//

package common

import (
	"math/rand"
	"time"
)

const letterBytes = "abcdefghijklmnopqrstuvwxyz"
const lettersNum = len(letterBytes)

// Random generates random numbers and strings
type Random interface {
	// Int returns int from range 0..n
	Int(n int) int

	// IntFromRange returns int from range from..to
	IntFromRange(from int, to int) int

	// String returns string of specified length with random lower-case letters
	String(length int) string
}

type RandomImpl struct {
	rand *rand.Rand
}

func NewRand() Random {
	return &RandomImpl{
		rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

func (r *RandomImpl) Int(n int) int {
	return r.rand.Intn(n)
}

func (r *RandomImpl) IntFromRange(from int, to int) int {
	return from + r.rand.Intn(to-from)
}

func (r *RandomImpl) String(length int) string {
	b := make([]byte, length)
	for i := range b {
		b[i] = letterBytes[r.Int(lettersNum)]
	}
	return string(b)
}
