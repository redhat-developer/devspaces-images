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

import { Button, Modal, ModalVariant, Text, TextContent } from '@patternfly/react-core';
import { History, UnregisterCallback } from 'history';
import React, { useEffect, useState } from 'react';

type Props = {
  hasUnsavedChanges: () => boolean;
  onDiscardChanges: (pathname: string) => void;
  history: History;
  isOpenInitState?: boolean;
};

function UnsavedChangesModal(props: Props): React.ReactElement {
  const [isOpen, setIsOpen] = useState(props.isOpenInitState === true);
  const [pathname, setPathname] = useState('/');

  const useUnload = callback => {
    const refObject = React.useRef(callback);
    useEffect(() => {
      const onBlock = refObject.current;
      const unblock: UnregisterCallback = props.history.block(onBlock);
      return () => {
        // unblock the navigation
        unblock();
      };
    }, [refObject]);
  };

  useUnload(prompt => {
    setPathname(prompt.pathname);
    if (props.hasUnsavedChanges()) {
      // show a confirmation dialog
      setIsOpen(true);
      const focusedElement =
        (document.hasFocus() &&
          document.activeElement !== document.body &&
          document.activeElement !== document.documentElement &&
          document.activeElement) ||
        null;
      if (focusedElement) {
        (focusedElement as HTMLBaseElement).blur();
      }
      // navigation was blocked
      return false;
    }
    // navigation allow
    return true;
  });

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      title="Unsaved Changes"
      onClose={() => setIsOpen(false)}
      actions={[
        <Button
          key="confirm"
          variant="primary"
          onClick={() => {
            setTimeout(() => {
              props.onDiscardChanges(pathname);
            }, 100);
            setIsOpen(false);
          }}
        >
          Discard Changes
        </Button>,
        <Button key="cancel" variant="secondary" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>,
      ]}
    >
      <TextContent>
        <Text>
          You have unsaved changes. You may go ahead and discard all changes, or close this window
          and save them.
        </Text>
      </TextContent>
    </Modal>
  );
}

UnsavedChangesModal.displayName = 'UnsavedChangesModal';

export default UnsavedChangesModal;
