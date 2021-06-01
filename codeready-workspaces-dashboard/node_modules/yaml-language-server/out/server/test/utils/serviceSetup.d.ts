import { LanguageSettings } from '../../src/languageservice/yamlLanguageService';
export declare class ServiceSetup {
    languageSettings: LanguageSettings;
    withValidate(): ServiceSetup;
    withHover(): ServiceSetup;
    withCompletion(): ServiceSetup;
    withFormat(): ServiceSetup;
    withKubernetes(): ServiceSetup;
    withSchemaFileMatch(schemaFileMatch: {
        uri: string;
        fileMatch: string[];
    }): ServiceSetup;
    withCustomTags(customTags: string[]): ServiceSetup;
    withIndentation(indentation: string): ServiceSetup;
}
