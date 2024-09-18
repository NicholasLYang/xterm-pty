type Listener<T> = (arg: T) => void;
export type Event<T> = (listener: Listener<T>) => {
    dispose: () => void;
};
export declare class EventEmitter<T> {
    private listeners;
    private _register;
    register: (listener: Listener<T>) => {
        dispose: () => void;
    };
    fire(arg: T): void;
}
export {};
