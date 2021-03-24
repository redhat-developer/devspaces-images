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
	"testing"

	"github.com/stretchr/testify/assert"
)

var placeholder = []byte("\xef\xbf\xbd")

func TestShouldReturnEmptySliceIfNoDataIsGiven(t *testing.T) {
	data := []byte{}

	filter := &Utf8StreamFilter{}
	result := filter.ProcessRaw(data)

	assert.Equal(t, data, result)
}

func TestShouldReturnValidDataWithoutChange(t *testing.T) {
	data := []byte("\x45\x63\x6c\x69\x70\x73\x65\x20\xd0\xa7\xd0\xb5")

	filter := &Utf8StreamFilter{}
	result := filter.ProcessRaw(data)

	assert.Equal(t, data, result)
}

func TestShouldReplaceInvalidCharacterWithPlaceholder(t *testing.T) {
	data1 := []byte("\x56\x61\x6c\x69\x64\x20\x70")
	invalidData := []byte("\xff")
	data2 := []byte("\x68\x72\x61\x73\x65")

	// data1 + invalid byte + data2
	data := append(append(data1, invalidData...), data2...)
	// data1 + placeholder + data2
	expected := append(append(data1, placeholder...), data2...)

	filter := &Utf8StreamFilter{}
	result := filter.ProcessRaw(data)

	assert.Equal(t, expected, result)
}

func TestShouldReplaceAllInvalidCharactersWithPlaceholders(t *testing.T) {
	data1 := []byte("\x74\x65\x73\x74")
	data2 := []byte("\x74\x77\x6f")
	data3 := []byte("\x65\x72\x72\x6f\x72\x73")

	invalidChar1 := []byte("\x95")
	invalidChar2 := []byte("\xf4")

	// data1 + invalid character 1 + data2 + invalid character 2 + data3
	var data []byte
	data = append(data, data1...)
	data = append(data, invalidChar1...)
	data = append(data, data2...)
	data = append(data, invalidChar2...)
	data = append(data, data3...)
	// data1 + placeholder + data2 + placeholder + data 3
	var expected []byte
	expected = append(expected, data1...)
	expected = append(expected, placeholder...)
	expected = append(expected, data2...)
	expected = append(expected, placeholder...)
	expected = append(expected, data3...)

	filter := &Utf8StreamFilter{}
	result := filter.ProcessRaw(data)

	assert.Equal(t, expected, result)
}

func TestShouldReplaceSequentialInvalidCharactersWithPlaceholders(t *testing.T) {
	data1 := []byte("\x56\x61\x6c\x69\x64\x20\x70")
	invalidData := []byte("\xfd\x90")
	data2 := []byte("\x68\x72\x61\x73\x65")

	// data1 + invalid byte + invalid byte + data2
	data := append(append(data1, invalidData...), data2...)
	// data1 + placeholder + placeholder + data2
	expected := append(append(data1, placeholder...), append(placeholder, data2...)...)

	filter := &Utf8StreamFilter{}
	result := filter.ProcessRaw(data)

	assert.Equal(t, expected, result)
}

func TestShouldReturnAllPlaceholdersIfNoValidUtf8CharactersGiven(t *testing.T) {
	data := []byte("\xb0\xb1\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xbb\xbc\xbd\xbe\xbf")

	// each byte is replaced with placeholder
	expected := addPlaceholders([]byte{}, len(data))

	filter := &Utf8StreamFilter{}
	result := filter.ProcessRaw(data)

	assert.Equal(t, expected, result)
}

func TestShouldKeepSeparatedTwoBytesCharacterInCacheAndRestoreItWhenFollowingDataReceived(t *testing.T) {
	dataPart1 := []byte("\x45\x63\x6c\x69\x70\x73\x65\x20\xd0\xa7\xd0")
	dataPart2 := []byte("\xb5\xd1\x80\xd0\xba\xd0\xb0\xd1\x81\xd0\xb8")

	// dataPart1 without last byte
	expected1 := dataPart1[:len(dataPart1)-1]
	// dataPart2 which is preceded with last byte from dataPart1
	expected2 := append(dataPart1[len(dataPart1)-1:len(dataPart1)], dataPart2...)

	filter := &Utf8StreamFilter{}
	var result []byte

	result = filter.ProcessRaw(dataPart1)
	assert.Equal(t, expected1, result)

	result = filter.ProcessRaw(dataPart2)
	assert.Equal(t, expected2, result)
}

func TestShouldKeepSeparatedThreeBytesCharacterInCacheAndRestoreItWhenFollowingDataReceived(t *testing.T) {
	dataPart1 := []byte("\x53\x70\x65\x65\x64\x20\xe1\xbf")
	dataPart2 := []byte("\xa1\x20\x76\x65\x63\x74\x6f\x72")

	// dataPart1 without last 2 bytes
	expected1 := dataPart1[:len(dataPart1)-2]
	// dataPart2 which is preceded with last 2 bytes from dataPart1
	expected2 := append(dataPart1[len(dataPart1)-2:len(dataPart1)], dataPart2...)

	filter := &Utf8StreamFilter{}
	var result []byte

	result = filter.ProcessRaw(dataPart1)
	assert.Equal(t, expected1, result)

	result = filter.ProcessRaw(dataPart2)
	assert.Equal(t, expected2, result)
}

func TestShouldKeepSeparatedFourBytesCharacterInCacheAndRestoreItWhenFollowingDataReceived(t *testing.T) {
	dataPart1 := []byte("\x6c\x65\x66\x74\x20\xf0\x9f\xa0")
	dataPart2 := []byte("\x84\x20\x61\x72\x72\x6f\x77")

	// dataPart1 without last 3 bytes
	expected1 := dataPart1[:len(dataPart1)-3]
	// dataPart2 which is preceded with last 3 bytes from dataPart1
	expected2 := append(dataPart1[len(dataPart1)-3:len(dataPart1)], dataPart2...)

	filter := &Utf8StreamFilter{}
	var result []byte

	result = filter.ProcessRaw(dataPart1)
	assert.Equal(t, expected1, result)

	result = filter.ProcessRaw(dataPart2)
	assert.Equal(t, expected2, result)
}

func TestShouldReplaceInvalidCharacterWithPlaceholderAtTheEndOfDataPart(t *testing.T) {
	dataPart1 := []byte("\x56\x61\x6c\x69\x64\x20\x70\xfe")
	dataPart2 := []byte("\x68\x72\x61\x73\x65")

	// dataPart1 without last byte
	expected1 := dataPart1[:len(dataPart1)-1]
	// dataPart2 which is preceded by placeholder
	expected2 := append([]byte{}, placeholder...)
	expected2 = append(expected2, dataPart2...)

	filter := &Utf8StreamFilter{}
	var result []byte

	result = filter.ProcessRaw(dataPart1)
	assert.Equal(t, expected1, result)

	result = filter.ProcessRaw(dataPart2)
	assert.Equal(t, expected2, result)
}

func TestShouldReplaceLastInvalidByteWithPlaceholderCharacter(t *testing.T) {
	data := []byte("\x45\x63\x6c\x69\x70\x73\x65\xa0")

	// data with last byte replaced with placeholder
	expected := make([]byte, len(data)-1)
	copy(expected, data[:len(data)-1])
	expected = addPlaceholders(expected, 1)

	filter := &Utf8StreamFilter{}

	result := filter.ProcessRaw(data)
	assert.Equal(t, expected, result)
}

func TestShouldReplaceLastThreeInvalidBytesWithPlaceholderCharacters(t *testing.T) {
	data := []byte("\x45\x63\x6c\x69\x70\x73\x65\x88\x95\x97")

	// data with last 3 bytes replaced with placeholders
	expected := make([]byte, len(data)-3)
	copy(expected, data[:len(data)-3])
	expected = addPlaceholders(expected, 3)

	filter := &Utf8StreamFilter{}

	result := filter.ProcessRaw(data)
	assert.Equal(t, expected, result)
}

func TestShouldReplaceBytesWithPlaceholderCharactersIfLastByteBreaksUtf8Character(t *testing.T) {
	data := []byte("\x45\x63\x6c\x69\x70\x73\x65\xe2\x82\x21")

	// expected holds data slice with 2 pre-last charactes replaced with placeholders
	expected := make([]byte, len(data)-3)
	copy(expected, data[:len(data)-2])
	expected = addPlaceholders(expected, 2)
	expected = append(expected, data[len(data)-1])

	filter := &Utf8StreamFilter{}

	result := filter.ProcessRaw(data)
	assert.Equal(t, expected, result)
}

func TestShouldReplaceInvalidStartUtf8SymbolBytesWithPlaceholderCharacters(t *testing.T) {
	dataPart1 := []byte("\x45\x63\x6c\x69\x70\x73\x65\x20\xd0\xa7\xd0\xd0\xd0")
	dataPart2 := []byte("\xb5\x20\x77\x6f\x72\x6b\x73\x70\x61\x63\x65\x73")

	// dataPart1 without last 3 symbols but with 2 appended placeholders
	expected1 := make([]byte, len(dataPart1)-3)
	copy(expected1, dataPart1[:len(dataPart1)-3])
	expected1 = addPlaceholders(expected1, 2)

	// last byte from dataPart1 + dataPart2
	expected2 := []byte("\x00")
	expected2[0] = dataPart1[len(dataPart1)-1]
	expected2 = append(expected2, dataPart2...)

	filter := &Utf8StreamFilter{}
	var result []byte

	result = filter.ProcessRaw(dataPart1)
	assert.Equal(t, expected1, result)

	result = filter.ProcessRaw(dataPart2)
	assert.Equal(t, expected2, result)
}

func TestShouldReplaceInvalidStartUtf8SymbolByteWithPlaceholderCharacter(t *testing.T) {
	data := []byte("\x57\x72\x6f\x6e\x67\x20\x73\x74\x61\x72\x74\xdb\x21")

	// data with pre last byte replaced by placeholder
	var expected []byte
	expected = append(expected, data[:len(data)-2]...)
	expected = append(expected, placeholder...)
	expected = append(expected, data[len(data)-1])

	filter := &Utf8StreamFilter{}

	result := filter.ProcessRaw(data)
	assert.Equal(t, expected, result)
}

func TestShouldFlushKeptCharactersAsPlaceholders(t *testing.T) {
	data := []byte("\x53\x70\x65\x65\x64\x20\xe1\xbf")

	// dataPart1 without last 2 bytes
	expected := data[:len(data)-2]
	expectedRemainder := addPlaceholders([]byte{}, 2)

	filter := &Utf8StreamFilter{}
	var result []byte

	result = filter.ProcessRaw(data)
	assert.Equal(t, expected, result)

	result = filter.FlushBuffer()
	assert.Equal(t, expectedRemainder, result)
}

func addPlaceholders(data []byte, count int) []byte {
	for i := 0; i < count; i++ {
		data = append(data, placeholder...)
	}
	return data
}
