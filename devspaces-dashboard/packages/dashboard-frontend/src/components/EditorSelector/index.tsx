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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Button,
  Flex,
  FlexItem,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
  Title,
} from '@patternfly/react-core';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { EditorDefinition } from '@/components/EditorSelector/Definition';
import { EditorGallery } from '@/components/EditorSelector/Gallery';
import { AppState } from '@/store';
import { selectEditors } from '@/store/Plugins/chePlugins/selectors';

const DOCS_DEFINING_A_COMMON_IDE =
  'https://eclipse.dev/che/docs/stable/end-user-guide/defining-a-common-ide/';

type AccordionId = 'selector' | 'definition';

export type Props = MappedProps & {
  defaultEditorId: string;
  onSelect: (editorDefinition: string | undefined, editorImage: string | undefined) => void;
};
export type State = {
  definitionEditorValue: string | undefined;
  definitionImageValue: string | undefined;

  selectorEditorValue: string;

  expandedId: AccordionId | undefined;
};

class EditorSelector extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      definitionEditorValue: undefined,
      definitionImageValue: undefined,

      selectorEditorValue: '',

      expandedId: 'selector',
    };
  }

  private handleSelectorValueChange(editorId: string): void {
    this.setState({ selectorEditorValue: editorId });
    this.props.onSelect(editorId, undefined);
  }

  private handleDefinitionValueChange(
    editorDefinition: string | undefined,
    editorImage: string | undefined,
  ): void {
    this.setState({
      definitionEditorValue: editorDefinition,
      definitionImageValue: editorImage,
    });
    this.props.onSelect(editorDefinition, editorImage);
  }

  private handleToggle(expandedId: AccordionId): void {
    const { onSelect } = this.props;

    this.setState({
      expandedId: this.state.expandedId === expandedId ? this.state.expandedId : expandedId,
    });

    const { definitionEditorValue, definitionImageValue, selectorEditorValue } = this.state;

    if (expandedId === 'selector') {
      onSelect(selectorEditorValue, undefined);
    } else {
      onSelect(definitionEditorValue, definitionImageValue);
    }
  }

  render(): React.ReactElement {
    const { defaultEditorId, editors } = this.props;
    const { definitionEditorValue, definitionImageValue, selectorEditorValue, expandedId } =
      this.state;

    return (
      <Panel>
        <PanelHeader>
          <Title headingLevel="h3">Editor Selector</Title>
        </PanelHeader>
        <PanelMain>
          <PanelMainBody>
            <Accordion asDefinitionList={false}>
              <AccordionItem>
                <AccordionToggle
                  onClick={() => {
                    this.handleToggle('selector');
                  }}
                  isExpanded={expandedId === 'selector'}
                  id="accordion-item-selector"
                >
                  Choose an Editor
                </AccordionToggle>

                <AccordionContent
                  isHidden={expandedId !== 'selector'}
                  data-testid="editor-gallery-content"
                >
                  <Panel>
                    <PanelMain>
                      <PanelMainBody>
                        <EditorGallery
                          defaultEditorId={defaultEditorId}
                          editors={editors}
                          selectedEditorId={selectorEditorValue}
                          onSelect={editorId => this.handleSelectorValueChange(editorId)}
                        />
                      </PanelMainBody>
                    </PanelMain>
                  </Panel>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem>
                <AccordionToggle
                  onClick={() => {
                    this.handleToggle('definition');
                  }}
                  isExpanded={expandedId === 'definition'}
                  id="accordion-item-definition"
                >
                  Use an Editor Definition
                </AccordionToggle>

                <AccordionContent
                  isHidden={expandedId !== 'definition'}
                  data-testid="editor-definition-content"
                >
                  <Panel>
                    <PanelMain>
                      <PanelMainBody>
                        <EditorDefinition
                          editorDefinition={definitionEditorValue}
                          editorImage={definitionImageValue}
                          onChange={(editorDefinition, editorImage) =>
                            this.handleDefinitionValueChange(editorDefinition, editorImage)
                          }
                        />
                      </PanelMainBody>
                    </PanelMain>
                  </Panel>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Flex>
              <FlexItem align={{ default: 'alignRight' }}>
                <Button
                  component="a"
                  href={DOCS_DEFINING_A_COMMON_IDE}
                  variant="link"
                  isInline
                  target="_blank"
                >
                  How to specify and use a custom editor
                </Button>
              </FlexItem>
            </Flex>
          </PanelMainBody>
        </PanelMain>
      </Panel>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  editors: selectEditors(state),
});

const connector = connect(mapStateToProps, null, null, {
  // forwardRef is mandatory for using `@react-mock/state` in unit tests
  forwardRef: true,
});

type MappedProps = ConnectedProps<typeof connector>;
export default connector(EditorSelector);
