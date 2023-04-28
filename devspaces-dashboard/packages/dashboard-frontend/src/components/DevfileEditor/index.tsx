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

import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { AppState } from '../../store';
import { DisposableCollection } from '../../services/helpers/disposable';
import {
  ProtocolToMonacoConverter,
  MonacoToProtocolConverter,
} from 'monaco-languageclient/lib/monaco-converter';
import { languages, editor, Range, Position, IRange } from 'monaco-editor-core';
import {
  TextDocument,
  getLanguageService,
  LanguageService,
  CompletionItem,
} from 'yaml-language-server';
import { initDefaultEditorTheme } from '../../services/monacoThemeRegister';
import stringify, { language, conf } from '../../services/helpers/editor';
import { merge, isMatch } from 'lodash';
import devfileApi from '../../services/devfileApi';
import { selectDevfileSchema } from '../../store/DevfileRegistries/selectors';
import { selectBranding } from '../../store/Branding/selectors';

import styles from './index.module.css';

const LANGUAGE_ID = 'yaml';
const YAML_SERVICE = 'yamlService';
const MONACO_CONFIG: editor.IStandaloneEditorConstructionOptions = {
  language: 'yaml',
  wordWrap: 'on',
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  readOnly: false,
};

(self as any).MonacoEnvironment = {
  getWorkerUrl: () => './editor.worker.js',
};

type Props = MappedProps & {
  devfile: che.WorkspaceDevfile | devfileApi.Devfile;
  decorationPattern?: string;
  onChange: (newValue: string, isValid: boolean) => void;
  isReadonly?: boolean;
  additionSchema?: { [key: string]: any };
};
type State = {
  errorMessage: string;
};

export class DevfileEditor extends React.PureComponent<Props, State> {
  public static EDITOR_THEME: string | undefined;
  private readonly toDispose = new DisposableCollection();
  private handleResize: () => void;
  private editor: editor.IStandaloneCodeEditor;
  private readonly yamlService: LanguageService;
  private m2p = new MonacoToProtocolConverter();
  private p2m = new ProtocolToMonacoConverter();
  private createDocument = (model): TextDocument =>
    TextDocument.create(
      'inmemory://model.yaml',
      model.getModeId(),
      model.getVersionId(),
      model.getValue(),
    );
  private skipNextOnChange: boolean;

  constructor(props: Props) {
    super(props);

    this.state = {
      errorMessage: '',
    };

    // lazy initialization
    if (!window[YAML_SERVICE]) {
      this.yamlService = getLanguageService(() => Promise.resolve(''), {
        resolveRelativePath: () => '',
      });
      window[YAML_SERVICE] = this.yamlService;
    } else {
      this.yamlService = window[YAML_SERVICE];
      this.updateSchema();
      return;
    }
    if (!DevfileEditor.EDITOR_THEME) {
      // define the default
      DevfileEditor.EDITOR_THEME = initDefaultEditorTheme();
    }
    if (
      languages?.getLanguages &&
      languages.getLanguages().find(language => language.id === LANGUAGE_ID) === undefined
    ) {
      // register the YAML language with Monaco
      languages.register({
        id: LANGUAGE_ID,
        extensions: ['.yaml', '.yml'],
        aliases: ['YAML', 'yaml'],
        mimetypes: ['application/yaml'],
      });
      languages.setMonarchTokensProvider(LANGUAGE_ID, language);
      languages.setLanguageConfiguration(LANGUAGE_ID, conf);
    }
    // register language server providers
    this.registerLanguageServerProviders();
    this.updateSchema();
  }

  private updateSchema(): void {
    let jsonSchema = this.props.devfileSchema ? Object.assign({}, this.props.devfileSchema) : {};
    const additionSchema = this.props.additionSchema;
    if (additionSchema) {
      if (jsonSchema?.oneOf) {
        jsonSchema.oneOf = jsonSchema.oneOf.map(schema => merge({}, schema, additionSchema));
      } else {
        jsonSchema = merge({}, jsonSchema, additionSchema);
      }
    }
    const schemas = [{ uri: 'inmemory:yaml', fileMatch: ['*'], schema: jsonSchema }];
    this.yamlService.configure({ validate: true, hover: true, schemas, completion: true });
  }

  public updateContent(devfile: che.WorkspaceDevfile | devfileApi.Devfile): void {
    if (!this.editor) {
      return;
    }
    this.skipNextOnChange = true;
    const doc = this.editor.getModel();
    doc?.setValue(stringify(devfile));
  }

  public componentDidUpdate(prevProps: Props): void {
    if (this.handleResize) {
      this.handleResize();
    }
    if (!isMatch(prevProps.additionSchema || {}, this.props.additionSchema || {})) {
      this.updateSchema();
    }
  }

  // This method is called when the component is first added to the document
  public componentDidMount(): void {
    const element = window.document.querySelector(`.${styles.devfileEditor} .${styles.monaco}`);
    if (element !== null) {
      const value = stringify(this.props.devfile);
      this.editor = editor.create(
        element as HTMLElement,
        Object.assign(
          { value },
          {
            ...MONACO_CONFIG,
            readOnly: !!this.props.isReadonly,
          },
        ),
      );
      const doc = this.editor.getModel();
      doc?.updateOptions({ tabSize: 2 });

      const handleResize = (): void => {
        const layout = { height: element.clientHeight, width: element.clientWidth };
        // if the element is hidden
        if (layout.height === 0 || layout.width === 0) {
          return;
        }
        this.editor.layout(layout);
      };
      this.handleResize = handleResize;
      window.addEventListener('resize', handleResize);
      this.toDispose.push({
        dispose: () => {
          window.removeEventListener('resize', handleResize);
        },
      });

      let oldDecorationIds: string[] = []; // Array containing previous decorations identifiers.
      const updateDecorations = (): void => {
        if (this.props.decorationPattern) {
          oldDecorationIds = this.editor.deltaDecorations(oldDecorationIds, this.getDecorations());
        }
      };
      updateDecorations();
      doc?.onDidChangeContent(() => {
        updateDecorations();
        this.onChange(this.editor.getValue(), true);
      });
      // init language server validation
      this.initLanguageServerValidation(this.editor);
    }
  }

  // This method is called when the component is removed from the document
  public componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  public render(): React.ReactElement {
    const href = this.props.branding.docs.devfile;
    const { errorMessage } = this.state;

    return (
      <div className={styles.devfileEditor}>
        <div className={styles.monaco}>&nbsp;</div>
        <div className={styles.error}>{errorMessage}</div>
        <a target="_blank" rel="noopener noreferrer" href={href}>
          Devfile Documentation
        </a>
      </div>
    );
  }

  private getDecorations(): editor.IModelDecoration[] {
    const decorations: editor.IModelDecoration[] = [];
    if (this.props.decorationPattern) {
      const decorationRegExp = new RegExp(this.props.decorationPattern, 'img');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const model = this.editor.getModel()!;
      const value = this.editor.getValue();
      let match = decorationRegExp.exec(value);
      while (match) {
        const startPosition = model.getPositionAt(match.index);
        const endPosition = model.getPositionAt(match.index + match[0].length);
        const range = new Range(
          startPosition.lineNumber,
          startPosition.column,
          endPosition.lineNumber,
          endPosition.column,
        );
        const options: editor.IModelDecorationOptions = {
          inlineClassName: styles.devfileEditorDecoration,
        };
        decorations.push({
          range,
          options,
        } as editor.IModelDecoration);
        match = decorationRegExp.exec(value);
      }
    }
    return decorations;
  }

  private onChange(newValue: string, isValid: boolean): void {
    if (this.skipNextOnChange) {
      this.skipNextOnChange = false;
      return;
    }
    this.props.onChange(newValue, isValid);
  }

  private registerLanguageServerProviders(): void {
    const createDocument = this.createDocument;
    const yamlService = this.yamlService;
    const m2p = this.m2p;
    const p2m = this.p2m;

    const sortTextCache = {};
    const createSortText = (pluginId: string): string => {
      if (sortTextCache[pluginId]) {
        return sortTextCache[pluginId];
      }
      const [publisher, name, version] = pluginId.split('/');
      const semverRE = /^\d+?\.\d+?\.\d+?/;
      let versionText: string;
      if (semverRE.test(version)) {
        let [major, minor, rest] = version.split('.');
        major = addLeadingZeros(major);
        minor = addLeadingZeros(minor);
        rest = rest.replace(/^(\d+)/, addLeadingZeros);
        versionText = `${major}.${minor}.${rest}`;
      } else {
        let prefix = '-';
        if (version === 'latest') {
          prefix += '0';
        } else if (version === 'next') {
          prefix += '1';
        } else if (version === 'nightly') {
          prefix += '2';
        }
        versionText = `${prefix}${version}`;
      }
      const sortText = `${publisher}/${name}/${versionText}`;
      sortTextCache[pluginId] = sortText;
      return sortText;
    };
    const addLeadingZeros = (number: string): string => {
      while (number.length < 4) {
        number = '0' + number;
      }
      return number;
    };

    languages.registerCompletionItemProvider(LANGUAGE_ID, {
      provideCompletionItems(model: editor.ITextModel, position: Position) {
        const document = createDocument(model);
        return yamlService
          .doComplete(document, m2p.asPosition(position.lineNumber, position.column), true)
          .then(list => {
            const completionResult = p2m.asCompletionResult(
              list as any,
              {
                startColumn: position.column,
                startLineNumber: position.lineNumber,
                endColumn: position.column,
                endLineNumber: position.lineNumber,
              } as IRange,
            );
            if (!completionResult || !completionResult.suggestions) {
              return completionResult;
            }
            // convert completionResult into suggestions
            const defaultInsertTextRules = languages.CompletionItemInsertTextRule.InsertAsSnippet;
            const suggestions = completionResult.suggestions.map(suggestion => {
              return Object.assign(suggestion, {
                insertTextRules: suggestion.insertTextRules
                  ? suggestion.insertTextRules
                  : defaultInsertTextRules,
                sortText: createSortText(suggestion.insertText),
              });
            });
            return { suggestions };
          });
      },
      async resolveCompletionItem(model, range, item) {
        return (yamlService as any)
          .doResolve(m2p.asCompletionItem(item))
          .then((result: CompletionItem) => p2m.asCompletionItem(result as any, range));
      },
    } as any);
    languages.registerDocumentSymbolProvider(LANGUAGE_ID, {
      provideDocumentSymbols(model: editor.ITextModel) {
        return p2m.asSymbolInformations(yamlService.findDocumentSymbols(createDocument(model)));
      },
    });
    languages.registerHoverProvider(LANGUAGE_ID, {
      async provideHover(model: editor.ITextModel, position: Position) {
        const hover = await yamlService.doHover(
          createDocument(model),
          m2p.asPosition(position.lineNumber, position.column),
        );
        return p2m.asHover(hover);
      },
    });
  }

  private initLanguageServerValidation(_editor: editor.IStandaloneCodeEditor): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const model = _editor.getModel()!;
    let validationTimer: number;

    model.onDidChangeContent(() => {
      const document = this.createDocument(model);
      this.setState({ errorMessage: '' });
      if (validationTimer) {
        clearTimeout(validationTimer);
      }
      validationTimer = window.setTimeout(() => {
        this.yamlService.doValidation(document, false).then(diagnostics => {
          const markers = this.p2m.asDiagnostics(diagnostics) as any;
          let errorMessage = '';
          if (Array.isArray(markers) && markers.length > 0) {
            const { message, startLineNumber, startColumn } = markers[0];
            if (startLineNumber && startColumn) {
              errorMessage += `line[${startLineNumber}] column[${startColumn}]: `;
            }
            errorMessage += `Error. ${message}`;
          }
          if (errorMessage) {
            this.setState({ errorMessage: `Error. ${errorMessage}` });
            this.onChange(_editor.getValue(), false);
          }
          editor.setModelMarkers(model, 'default', markers ? markers : []);
        });
      });
    });
  }
}

const mapStateToProps = (state: AppState) => ({
  branding: selectBranding(state),
  devfileSchema: selectDevfileSchema(state),
});

const connector = connect(mapStateToProps, null, null, { forwardRef: true });

type MappedProps = ConnectedProps<typeof connector>;
export default connector(DevfileEditor);
