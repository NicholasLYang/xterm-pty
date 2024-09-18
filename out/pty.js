"use strict";
// This module provides the "openpty" function.
// It returns a master object, which is an addon for xterm.js, and a slave
// object, which serves as stdin/stdout for a process.
//
// Typical usage:
//
//   // Start an xterm.js instance
//   const xterm = new Terminal();
//
//   // Create master/slave objects
//   const { master, slave } = openpty();
//
//   // Connect the master object to xterm.js
//   xterm.loadAddon(ldiscAddon);
//
//   // Use slave.write instead of xterm.write
//   slave.write("Hello, world!\nInput your name:");
//
//   // Use slave.onReadable and slave.read instead of xterm.onData
//   slave.onReadable(() => {
//     xterm.write(`Hi, ${ slave.read().trim() }!\n`);
//   });
Object.defineProperty(exports, "__esModule", { value: true });
exports.openpty = exports.Slave = void 0;
const eventEmitter_1 = require("./eventEmitter");
const lineDiscipline_1 = require("./lineDiscipline");
const termios_1 = require("./termios");
const utils_1 = require("./utils");
const bufferLimit = 4096;
class Master {
    constructor(ldisc, slave) {
        this.ldisc = ldisc;
        this.slave = slave;
        this.disposables = [];
        this._onWrite = new eventEmitter_1.EventEmitter();
        this.onWrite = this._onWrite.register;
        this.fromLdiscToLowerBuffer = [];
        this.waitingForLower = false; // xterm.js implements buffering
        const flushToLower = () => {
            if (this.fromLdiscToLowerBuffer.length >= 1) {
                this.waitingForLower = true;
                const buf = new Uint8Array(this.fromLdiscToLowerBuffer.splice(0, 4096));
                if (this.fromLdiscToLowerBuffer.length <= bufferLimit)
                    this.notifyWritable();
                this._onWrite.fire([buf, flushToLower]);
            }
            else {
                this.waitingForLower = false;
            }
        };
        this.ldisc.onWriteToLower((buf) => {
            this.fromLdiscToLowerBuffer.push(...buf);
            if (!this.waitingForLower)
                flushToLower();
        });
        const { notifyWritable, notifyResize } = slave.initFromMaster();
        this.notifyWritable = notifyWritable;
        this.notifyResize = notifyResize;
    }
    activate(xterm) {
        this.onWrite(([buf, callback]) => xterm.write(buf, callback));
        const onData = (str) => this.ldisc.writeFromLower(str);
        this.disposables.push(xterm.onData(onData), xterm.onBinary(onData), xterm.onResize(({ cols, rows }) => this.notifyResize(rows, cols)));
    }
    dispose() {
        this.disposables.forEach((d) => d.dispose());
        this.disposables.length = 0;
    }
}
class Slave {
    constructor(ldisc) {
        this.ldisc = ldisc;
        this._onReadable = new eventEmitter_1.EventEmitter();
        this.onReadable = this._onReadable.register;
        this._onWritable = new eventEmitter_1.EventEmitter();
        this.onWritable = this._onWritable.register;
        this._onSignal = new eventEmitter_1.EventEmitter();
        this.onSignal = this._onSignal.register;
        this.fromLdiscToUpperBuffer = [];
        this.fromUpperToLdiscBuffer = [];
        this.winsize = [80, 24];
        this.ldisc.onWriteToUpper((buf) => {
            this.fromLdiscToUpperBuffer.push(...buf);
            this._onReadable.fire();
        });
        this.ldisc.onFlowActivated(() => {
            if (this.fromUpperToLdiscBuffer.length >= 1) {
                this.ldisc.writeFromUpper(this.fromUpperToLdiscBuffer);
                this.fromUpperToLdiscBuffer.length = 0;
            }
        });
        this.ldisc.onSignalToUpper((sig) => {
            this._onSignal.fire(sig);
        });
    }
    initFromMaster() {
        return {
            notifyWritable: () => this._onWritable.fire(),
            notifyResize: (rows, cols) => {
                this.winsize = [cols, rows];
                this._onSignal.fire("SIGWINCH");
            },
        };
    }
    get readable() {
        return this.fromLdiscToUpperBuffer.length >= 1;
    }
    read(length) {
        const len = typeof length !== "undefined"
            ? Math.min(this.fromLdiscToUpperBuffer.length, length)
            : this.fromLdiscToUpperBuffer.length;
        return this.fromLdiscToUpperBuffer.splice(0, len);
    }
    get writable() {
        return this.fromUpperToLdiscBuffer.length <= bufferLimit;
    }
    write(arg) {
        const buf = typeof arg == "string" ? (0, utils_1.stringToUtf8Bytes)(arg) : arg;
        this.fromUpperToLdiscBuffer = this.fromUpperToLdiscBuffer.concat(buf);
        if (this.ldisc.flow) {
            this.ldisc.writeFromUpper(this.fromUpperToLdiscBuffer);
            this.fromUpperToLdiscBuffer.length = 0;
        }
    }
    ioctl(req, arg) {
        switch (req) {
            case "TCGETS":
                return this.ldisc.termios.clone();
            case "TCSETS":
                this.ldisc.termios = termios_1.Termios.fromConfig(arg);
                return;
            case "TIOCGWINSZ":
                return this.winsize.slice();
        }
    }
}
exports.Slave = Slave;
const openpty = () => {
    const ldisc = new lineDiscipline_1.LineDiscipline();
    const slave = new Slave(ldisc);
    const master = new Master(ldisc, slave);
    return { master, slave };
};
exports.openpty = openpty;
//# sourceMappingURL=pty.js.map