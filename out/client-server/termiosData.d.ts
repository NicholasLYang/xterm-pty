import { Termios } from "../termios";
export type TtyRequest = {
    ttyRequestType: "read";
    length: number;
} | {
    ttyRequestType: "write";
    buf: number[];
} | {
    ttyRequestType: "input";
} | {
    ttyRequestType: "output";
    char: number;
} | {
    ttyRequestType: "poll";
    timeout: number;
} | {
    ttyRequestType: "tcgets";
} | {
    ttyRequestType: "tcsets";
    data: number[];
} | {
    ttyRequestType: "tiocgwinsz";
};
export declare const termiosToData: (termios: Termios) => number[];
export declare const dataToTermios: (data: number[]) => Termios;
