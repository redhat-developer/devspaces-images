import { Disposable } from './services';
export { Disposable };
export declare class DisposableCollection implements Disposable {
    protected readonly disposables: Disposable[];
    dispose(): void;
    push(disposable: Disposable): Disposable;
}
//# sourceMappingURL=disposable.d.ts.map