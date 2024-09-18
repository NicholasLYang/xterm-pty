import { Terminal, ITerminalAddon } from "@xterm/xterm";
import { LineDiscipline } from "./lineDiscipline";
import { Termios, TermiosConfig } from "./termios";
export type Signal = "SIGINT" | "SIGQUIT" | "SIGTSTP" | "SIGWINCH";
declare class Master implements ITerminalAddon {
    private ldisc;
    private slave;
    private disposables;
    private _onWrite;
    readonly onWrite: (listener: (arg: [Uint8Array, () => void]) => void) => {
        dispose: () => void;
    };
    private fromLdiscToLowerBuffer;
    private waitingForLower;
    private notifyWritable;
    private notifyResize;
    constructor(ldisc: LineDiscipline, slave: Slave);
    activate(xterm: Terminal): void;
    dispose(): void;
}
export declare class Slave {
    private ldisc;
    private _onReadable;
    readonly onReadable: (listener: (arg: void) => void) => {
        dispose: () => void;
    };
    private _onWritable;
    readonly onWritable: (listener: (arg: void) => void) => {
        dispose: () => void;
    };
    private _onSignal;
    readonly onSignal: (listener: (arg: Signal) => void) => {
        dispose: () => void;
    };
    private fromLdiscToUpperBuffer;
    private fromUpperToLdiscBuffer;
    private winsize;
    constructor(ldisc: LineDiscipline);
    initFromMaster(): {
        notifyWritable: () => void;
        notifyResize: (rows: number, cols: number) => void;
    };
    get readable(): boolean;
    read(length?: number): number[];
    get writable(): boolean;
    write(arg: string | number[]): void;
    ioctl(req: "TCGETS"): Termios;
    ioctl(req: "TCSETS", arg: TermiosConfig): void;
    ioctl(req: "TIOCGWINSZ"): [number, number];
}
export declare const openpty: () => {
    master: Master;
    slave: Slave;
};
export {};
