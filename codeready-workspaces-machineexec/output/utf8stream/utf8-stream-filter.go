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

import (
	"bytes"
	"io"
	"unicode/utf8"
)

// Utf8StreamFilter replaces invalid runes with utf-8 placeholder character
type Utf8StreamFilter struct {
	// holds remainder of data in buffer.
	// is used when a rune is splitted between two data pieces.
	rest []byte
}

// ProcessRaw returns valid utf-8 symbols from given data
// Invalid bytes will be replaced with utf-8 placeholder character
func (sf *Utf8StreamFilter) ProcessRaw(data []byte) []byte {
	dataLen := len(data)
	if dataLen == 0 {
		return []byte{}
	}

	if len(sf.rest) > 0 {
		data = append(sf.rest, data...)
		sf.rest = []byte{}
	}

	if utf8.Valid(data) {
		return data
	}

	runeReader := bytes.NewReader(data)
	processedBytes := 0

	var result bytes.Buffer
	for {
		char, charLen, err := runeReader.ReadRune()
		if err == io.EOF {
			return result.Bytes()
		}
		if char == utf8.RuneError {
			if dataLen-processedBytes < utf8.UTFMax {
				// invalid byte sequence is close to the end of data part (3 or less bytes left)
				// it might be separated utf-8 character between two data parts
				if utf8.RuneStart(data[processedBytes]) {
					// it is possibly utf-8 characted splitted between two data parts

					return append(result.Bytes(), sf.handleLastBytes(data[processedBytes:])...)
				} else {
					// non first an utf-8 character byte which means that it is invalid byte
					// replace it with placeholder symbol
					result.WriteRune(utf8.RuneError)
				}
			} else {
				// invalid byte is in the middle of data
				// it means that this is not utf-8 character
				// replace it with placeholder symbol
				result.WriteRune(utf8.RuneError)
			}

			// should be always +1
			processedBytes += charLen
		} else {
			// add valid character to result data
			result.WriteRune(char)
			processedBytes += charLen
		}
	}
}

// handleLastBytes processes from 1 to 3 last bytes of given data
// which aren't complete utf-8 character (but may contain such).
// Returns data (placeholder characters), if any, which should be returned to data stream
// and saves remainder, if any, for the next data part.
func (sf *Utf8StreamFilter) handleLastBytes(dataRemainder []byte) []byte {
	l := len(dataRemainder)
	var result bytes.Buffer

	// RuneStart returns true for single byte characters
	if !utf8.RuneStart(dataRemainder[0]) {
		// first byte is not start byte of utf-8 character, so invalid in this position
		result.WriteRune(utf8.RuneError)
		if l == 1 {
			return result.Bytes()
		}
		return append(result.Bytes(), sf.handleLastBytes(dataRemainder[1:])...)
	}

	if l == 1 {
		if sf.isUtf8SimgleByteCharacter(dataRemainder[0]) {
			// 1 byte ASCII character
			sf.rest = []byte{}
			return dataRemainder
		}

		// start byte of an multibyte utf-8 character
		sf.rest = dataRemainder
		return []byte{}
	}

	if l == 2 {
		if sf.isUtf8Continuation(dataRemainder[1]) {
			sf.rest = dataRemainder
			return []byte{}
		}

		// second byte is not continues first one, so the first one is invalid
		result.WriteRune(utf8.RuneError)
		return append(result.Bytes(), sf.handleLastBytes(dataRemainder[1:])...)
	}

	// l == 3
	if !sf.isUtf8Continuation(dataRemainder[1]) {
		// second byte is not continue current utf-8 symbol (start byte),
		// which means the first byte is invalid
		result.WriteRune(utf8.RuneError)
		return append(result.Bytes(), sf.handleLastBytes(dataRemainder[1:])...)
	}
	if !sf.isUtf8Continuation(dataRemainder[2]) {
		// third byte doesn't continue utf-8 character sequence and previous 2 bytes aren't valid utf-8 character
		// so these 2 bytes are invalid
		result.WriteRune(utf8.RuneError)
		result.WriteRune(utf8.RuneError)
		return append(result.Bytes(), sf.handleLastBytes(dataRemainder[2:])...)
	}

	// all 3 bytes are part of utf-8 character
	sf.rest = dataRemainder
	return []byte{}
}

// isUtf8Continuation returns true if given byte could be valid part of utf-8 encoded character
func (*Utf8StreamFilter) isUtf8Continuation(arg byte) bool {
	// checks if arg is 10xxxxxx
	return arg&0xc0 == 0x80
}

// isUtf8SimgleByteCharacter returns true if given byte is a separate character (in ASCII)
func (*Utf8StreamFilter) isUtf8SimgleByteCharacter(arg byte) bool {
	// checks if arg is 0xxxxxxx
	return arg < utf8.RuneSelf
}

// FlushBuffer clears pending continuation bytes and returns placeholder for each of them.
// Should be used on closing stream connection.
func (sf *Utf8StreamFilter) FlushBuffer() []byte {
	var remainder bytes.Buffer
	for i := 0; i < len(sf.rest); i++ {
		remainder.WriteRune(utf8.RuneError)
	}
	return remainder.Bytes()
}
