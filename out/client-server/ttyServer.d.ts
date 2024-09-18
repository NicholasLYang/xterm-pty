import { Slave } from "../pty";
export declare class TtyServer {
    private slave;
    private shared;
    private streamCtrl;
    private streamData;
    private state;
    private timeoutHandler;
    ack(): void;
    fromWorkerBuf: number[];
    toWorkerBuf: number[];
    constructor(slave: Slave);
    feedToWorker(length: number): void;
    feedFromWorker(): void;
    waitForReadable(timeout: number): void;
    private stop_;
    start(worker: Worker, callback?: (ev: MessageEvent<any>) => void): void;
    stop(): void;
}
