import { Signal } from "./pty";
import { Termios } from "./termios";
import { Event } from "./eventEmitter";
export declare class LineDiscipline {
    private _onWriteToLower;
    readonly onWriteToLower: (listener: (arg: number[]) => void) => {
        dispose: () => void;
    };
    private _onWriteToUpper;
    readonly onWriteToUpper: (listener: (arg: number[]) => void) => {
        dispose: () => void;
    };
    private _onSignalToUpper;
    readonly onSignalToUpper: (listener: (arg: Signal) => void) => {
        dispose: () => void;
    };
    private _onFlowActivated;
    readonly onFlowActivated: (listener: (arg: void) => void) => {
        dispose: () => void;
    };
    private _onFlowDeactivated;
    readonly onFlowDeactivated: (listener: (arg: void) => void) => {
        dispose: () => void;
    };
    private T;
    private keyActions;
    private flowActivated;
    private column;
    private baseColumn;
    private vlnext;
    private echoprt;
    private toLowerBuf;
    private toUpperBuf;
    constructor();
    private activateFlow;
    private deactivateFlow;
    get flow(): boolean;
    get termios(): Termios;
    set termios(T: Termios);
    private clearToLower;
    private flushToLower;
    private outputToLower;
    private updateBaseColumn;
    private clearToUpper;
    private flushToUpper;
    private outputToUpper;
    private outputToLowerWithPostprocess;
    private echoToLower;
    private inputFromLowerWithPreprocess;
    private erase;
    private startECHOPRT;
    private finishECHOPRT;
    private signal;
    private checkStartFlow;
    private nextLiteral;
    private reprint;
    writeFromLower(arg: number[] | string): void;
    writeFromUpper(arg: number[] | string): void;
}
export interface LineDiscipline {
    readonly onWriteToLower: Event<number[]>;
    readonly onWriteToUpper: Event<number[]>;
    readonly onSignalToUpper: Event<Signal>;
    readonly onFlowActivated: Event<void>;
    readonly onFlowDeactivated: Event<void>;
    flow: boolean;
    termios: Termios;
    writeFromLower: (arg: number[] | string) => void;
    writeFromUpper: (arg: number[] | string) => void;
}
