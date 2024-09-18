"use strict";
// This module provides a "TtyClient" class.
//
// This code runs in a Web Worker thread.
// It sends TTY requests to TtyServer that works in the main thread.
// The communication is based on Worker.postmessage and SharedArrayBuffer.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TtyClient = void 0;
const termiosData_1 = require("./termiosData");
class TtyClient {
    constructor(shared) {
        this.streamCtrl = new Int32Array(shared, 0, 1);
        this.streamData = new Int32Array(shared, 4);
    }
    req(r) {
        this.streamCtrl[0] = 0;
        self.postMessage(r);
        Atomics.wait(this.streamCtrl, 0, 0);
    }
    onRead(length) {
        if (!length)
            length = this.streamData.length - 1;
        this.req({ ttyRequestType: "read", length });
        const len = this.streamData[0];
        return Array.from(this.streamData.slice(1, len + 1));
    }
    onWrite(buf) {
        this.req({ ttyRequestType: "write", buf });
    }
    onWaitForReadable(timeout) {
        this.req({ ttyRequestType: "poll", timeout });
        return this.streamData[0] == 1;
    }
    onIoctlTcgets() {
        this.req({ ttyRequestType: "tcgets" });
        return (0, termiosData_1.dataToTermios)(Array.from(this.streamData.slice(0, 13)));
    }
    onIoctlTcsets(termios) {
        const data = (0, termiosData_1.termiosToData)(termios);
        this.req({ ttyRequestType: "tcsets", data });
    }
    onIoctlTiocgwinsz() {
        this.req({ ttyRequestType: "tiocgwinsz" });
        return [this.streamData[0], this.streamData[1]];
    }
}
exports.TtyClient = TtyClient;
//# sourceMappingURL=ttyClient.js.map