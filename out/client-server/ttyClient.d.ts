import { Termios } from "../termios";
export declare class TtyClient {
    private streamCtrl;
    private streamData;
    constructor(shared: SharedArrayBuffer);
    private req;
    onRead(length: number | undefined): number[];
    onWrite(buf: number[]): void;
    onWaitForReadable(timeout: number): boolean;
    onIoctlTcgets(): Termios;
    onIoctlTcsets(termios: Termios): void;
    onIoctlTiocgwinsz(): number[];
}
