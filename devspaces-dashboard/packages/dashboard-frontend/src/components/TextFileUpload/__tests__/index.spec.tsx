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

import { ValidatedOptions } from '@patternfly/react-core';
import React from 'react';

import { TextFileUpload } from '@/components/TextFileUpload';
import getComponentRenderer, { screen } from '@/services/__mocks__/getComponentRenderer';

const { renderComponent, createSnapshot } = getComponentRenderer(getComponent);

const fieldId = 'text-file-upload-id';
const placeholder = 'Drag end drop file here';
const mockOnChange = jest.fn();

describe('TextFileUpload', () => {
  test('snapshot', () => {
    const snapshot = createSnapshot(placeholder, ValidatedOptions.default);
    expect(snapshot.toJSON()).toMatchSnapshot();
  });

  test('File uploader controls', () => {
    renderComponent(placeholder, ValidatedOptions.default);

    const fileUploader = screen.queryByTestId(fieldId);

    // file uploader is rendered
    expect(fileUploader).not.toBeNull();

    // input field
    expect(screen.queryByPlaceholderText(placeholder)).not.toBeNull();

    // Upload button
    expect(screen.queryByText('Upload')).not.toBeNull();

    // Clear button
    expect(screen.queryByText('Clear')).not.toBeNull();
  });
});

function getComponent(
  placeholder: string | undefined,
  validated: ValidatedOptions,
): React.ReactElement {
  return (
    <TextFileUpload
      fieldId={fieldId}
      placeholder={placeholder}
      validated={validated}
      onChange={mockOnChange}
    />
  );
}
