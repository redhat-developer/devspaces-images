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

import (
	"bytes"
	"container/ring"
	"strings"
	"sync"
)

const lineBufferSize = 1000

type LineRingBuffer struct {
	ring *ring.Ring
	lock *sync.Mutex
}

/**
Create new ring buffer to accumulate and restore machine-exec output.
*/
func New() *LineRingBuffer {
	return &LineRingBuffer{ring.New(lineBufferSize), &sync.Mutex{}}
}

func (lineBuff *LineRingBuffer) Write(bts []byte) {
	defer lineBuff.lock.Unlock()
	lineBuff.lock.Lock()

	scanner := CreateLineScanner(bts)

	if !scanner.Scan() {
		return
	}

	nextText := scanner.Text()
	lastRing := lineBuff.ring.Prev()
	if lineBuff.shouldContinueLastRing(lastRing, nextText) {
		lastRing.Value = lastRing.Value.(string) + nextText
	} else {
		lineBuff.ring.Value = nextText
		lineBuff.ring = lineBuff.ring.Next()
	}

	for scanner.Scan() {
		lineBuff.ring.Value = scanner.Text()
		lineBuff.ring = lineBuff.ring.Next()
	}
}

func (lineBuff *LineRingBuffer) GetContent() string {
	defer lineBuff.lock.Unlock()
	lineBuff.lock.Lock()

	var buffer bytes.Buffer

	var line string
	lineBuff.ring.Do(func(p interface{}) {
		if p != nil {
			line = p.(string)
			buffer.WriteString(line)
		}
	})

	return buffer.String()
}

func (lineBuff *LineRingBuffer) shouldContinueLastRing(lastRing *ring.Ring, nextText string) bool {
	if lastRing == nil || lastRing.Value == nil {
		return false
	}

	lastLine := lastRing.Value.(string)

	return !strings.HasSuffix(lastLine, "\n")
}
