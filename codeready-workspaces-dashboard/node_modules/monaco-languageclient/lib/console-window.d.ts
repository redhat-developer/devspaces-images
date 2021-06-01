import { MessageActionItem, MessageType, Window, OutputChannel } from './services';
export declare class ConsoleWindow implements Window {
    protected readonly channels: Map<string, OutputChannel>;
    showMessage<T extends MessageActionItem>(type: MessageType, message: string, ...actions: T[]): Thenable<T | undefined>;
    createOutputChannel(name: string): OutputChannel;
}
//# sourceMappingURL=console-window.d.ts.map