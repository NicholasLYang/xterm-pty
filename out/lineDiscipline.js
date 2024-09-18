"use strict";
// This module provides LineDiscipline class.
//
// It glues the low-level device (e.g., xterm.js) with the high-level process
// (e.g., JavaScript code and an Emscripten'ed process).
//
// It receives an input event from the lower layer (writeFromLower()).
// Depending on the "termios" configuration, it handles some special characters
// such as Ctrl+C, applies some translations to the input, echos it back to the
// lower layers, etc. Finally it conveys the input to the upper layer
// (onWriteToUpper() or onSignalToUpper()).
//
// It also receives an output event form the upper layer (writeFromUpper()).
// Again, it applies some translation (such as replacing NL with CR+NL)
// depending on termios. And finally it conveys the output to the lower layer
// (onWriteToLower()).
//
//                +-------+
//                | Upper | (e.g., an Emscripten'ed process)
//                +-------+
//                  |   ^
// writeFromUpper() |   | onWriteToUpper() (and onSignalToUpper())
//                  V   |
//           +-----------------+
//           | Line discipline |
//           +-----------------+
//                  |   ^
// onWriteToLower() |   | writeFromLower()
//                  V   |
//                +-------+
//                | Lower | (e.g., xterm.js)
//                +-------+
//
// References:
//
// https://en.wikipedia.org/wiki/Line_discipline
// https://man7.org/linux/man-pages/man3/termios.3.html
// https://pubs.opengroup.org/onlinepubs/009695299/basedefs/xbd_chap11.html
// https://pubs.opengroup.org/onlinepubs/009695299/utilities/stty.html
// https://github.com/torvalds/linux/blob/master/drivers/tty/n_tty.c
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineDiscipline = void 0;
const utils_1 = require("./utils");
const termios_1 = require("./termios");
const eventEmitter_1 = require("./eventEmitter");
class LineDiscipline {
    constructor() {
        // callbacks
        this._onWriteToLower = new eventEmitter_1.EventEmitter();
        this.onWriteToLower = this._onWriteToLower.register;
        this._onWriteToUpper = new eventEmitter_1.EventEmitter();
        this.onWriteToUpper = this._onWriteToUpper.register;
        this._onSignalToUpper = new eventEmitter_1.EventEmitter();
        this.onSignalToUpper = this._onSignalToUpper.register;
        this._onFlowActivated = new eventEmitter_1.EventEmitter();
        this.onFlowActivated = this._onFlowActivated.register;
        this._onFlowDeactivated = new eventEmitter_1.EventEmitter();
        this.onFlowDeactivated = this._onFlowDeactivated.register;
        // states
        this.T = termios_1.defaultTermios;
        this.keyActions = new Array(256).fill("normal");
        this.flowActivated = true; // false after VSTOP (C-s), true after VSTART (C-q)
        this.column = 0; // the column that the cursor is in
        this.baseColumn = 0; // the column that starts the to-upper buffer
        this.vlnext = false; // waiting for the next character after VLNEXT (C-v)
        this.echoprt = false; // erasing with ECHOPRT
        this.toLowerBuf = []; // flushed immediately every call
        this.toUpperBuf = []; // flushed after NL is input (in ICANON mode)
        this.termios = termios_1.defaultTermios;
    }
    activateFlow() {
        this.flowActivated = true;
        this._onFlowActivated.fire();
    }
    deactivateFlow() {
        this.flowActivated = false;
        this._onFlowDeactivated.fire();
    }
    get flow() {
        return this.flowActivated;
    }
    get termios() {
        return this.T;
    }
    set termios(T) {
        this.T = T;
        const keyActions = new Array(256).fill("normal");
        if (T.ICANON_P) {
            keyActions[T.EOF_V] = "VEOF";
            keyActions[T.EOL_V] = "VEOL";
            keyActions[T.EOL2_V] = "VEOL";
            keyActions[T.ERASE_V] = "VERASE";
            keyActions[T.KILL_V] = "VKILL";
            if (T.IEXTEN_P) {
                keyActions[T.REPRINT_V] = "VREPRINT";
                keyActions[T.WERASE_V] = "VWERASE";
            }
        }
        if (T.IEXTEN_P) {
            keyActions[T.LNEXT_V] = "VLNEXT";
        }
        if (T.IXON_P) {
            keyActions[T.START_V] = "VSTART";
            keyActions[T.STOP_V] = "VSTOP";
        }
        if (T.ISIG_P) {
            keyActions[T.INTR_V] = "VINTR";
            keyActions[T.QUIT_V] = "VQUIT";
            keyActions[T.SUSP_V] = "VSUSP";
        }
        keyActions[0] = "normal"; // Ignore any action for NUL character
        this.keyActions = keyActions;
        if (!this.T.IXON_P) {
            this.activateFlow();
            this.flushToLower();
        }
    }
    clearToLower() {
        this.toLowerBuf.length = 0;
    }
    flushToLower() {
        if (this.flowActivated == false)
            return;
        this._onWriteToLower.fire(this.toLowerBuf);
        this.clearToLower();
    }
    outputToLower(buf) {
        this.toLowerBuf.push(...buf);
    }
    updateBaseColumn() {
        if (this.toUpperBuf.length == 0) {
            this.baseColumn = this.column;
        }
    }
    clearToUpper() {
        this.toUpperBuf.length = 0;
        this.updateBaseColumn();
    }
    flushToUpper() {
        this._onWriteToUpper.fire(this.toUpperBuf);
        this.clearToUpper();
    }
    outputToUpper(c) {
        this.toUpperBuf.push(c);
    }
    outputToLowerWithPostprocess(c) {
        if (this.T.OPOST_P) {
            switch (c) {
                case utils_1.BS:
                    if (this.column > 0)
                        this.column--;
                    this.outputToLower([utils_1.BS]);
                    break;
                case utils_1.TAB: {
                    const spaces = 8 - (this.column % 8);
                    this.column += spaces;
                    this.outputToLower(this.T.TABDLY_XTABS_P ? new Array(spaces).fill(utils_1.SP) : [utils_1.TAB]);
                    break;
                }
                case utils_1.NL:
                    if (this.T.ONLCR_P) {
                        this.baseColumn = this.column = 0;
                        this.outputToLower([utils_1.CR, utils_1.NL]);
                    }
                    else if (this.T.ONLRET_P) {
                        this.column = 0;
                        this.outputToLower([utils_1.NL]);
                    }
                    else {
                        this.baseColumn = this.column;
                        this.outputToLower([utils_1.NL]);
                    }
                    break;
                case utils_1.CR:
                    if (this.T.ONOCR_P && this.column == 0) {
                        // nothing printed
                    }
                    else if (this.T.OCRNL_P) {
                        if (this.T.ONLRET_P)
                            this.baseColumn = this.column = 0;
                        this.outputToLower([utils_1.NL]);
                    }
                    else {
                        this.baseColumn = this.column = 0;
                        this.outputToLower([utils_1.CR]);
                    }
                    break;
                default:
                    if (!(this.T.IUTF8_P && (0, utils_1.isUtf8ContinuationByte)(c)))
                        this.column++;
                    this.outputToLower(this.T.OLCUC_P ? [(0, utils_1.toupper)(c)] : [c]);
                    break;
            }
        }
        else {
            this.outputToLower([c]);
        }
    }
    echoToLower(chars, raw) {
        if (typeof chars == "number")
            chars = [chars];
        for (const c of chars) {
            if (this.T.ECHOCTL_P && (0, utils_1.iscntrl)(c) && c != utils_1.TAB && !raw) {
                this.outputToLower([94 /* '^' */, c ^ 0x40]);
                this.column += 2;
            }
            else {
                this.outputToLowerWithPostprocess(c);
            }
        }
    }
    inputFromLowerWithPreprocess(c) {
        if (c == utils_1.CR) {
            if (this.T.IGNCR_P)
                return;
            if (this.T.ICRNL_P)
                c = utils_1.NL;
        }
        else if (c == utils_1.NL && this.T.INLCR_P) {
            c = utils_1.CR;
        }
        if (this.T.ICANON_P && c == utils_1.NL) {
            // flush the to-upper buffer
            if (this.T.ECHO_P || this.T.ECHONL_P) {
                this.echoToLower(utils_1.NL, true);
                this.flushToLower();
            }
            this.outputToUpper(utils_1.NL);
            this.flushToUpper();
        }
        else if (this.T.ECHO_P) {
            this.finishECHOPRT();
            this.updateBaseColumn();
            if (c == utils_1.NL) {
                this.echoToLower(utils_1.NL, true);
            }
            else {
                this.echoToLower(c);
            }
            this.flushToLower();
            this.outputToUpper(c);
        }
        else {
            this.outputToUpper(c);
        }
        // writeFromLower will flush the to-upper buffer later
    }
    erase(type) {
        if (this.toUpperBuf.length == 0)
            return;
        if (type == "VKILL") {
            if (!this.T.ECHO_P) {
                this.clearToUpper();
                return;
            }
            if (!this.T.ECHOK_P || !this.T.ECHOKE_P || !this.T.ECHOE_P) {
                this.clearToUpper();
                this.finishECHOPRT();
                this.echoToLower(this.T.KILL_V);
                if (this.T.ECHOK_P)
                    this.echoToLower(utils_1.NL, true);
                return;
            }
        }
        let alnumsFound = false;
        for (let idx = this.toUpperBuf.length - 1; idx >= 0; idx--) {
            const c = this.toUpperBuf[idx];
            if (this.T.IUTF8_P && (0, utils_1.isUtf8ContinuationByte)(c))
                continue;
            if (type == "VWERASE") {
                if ((0, utils_1.isalnum)(c) || c == 0x5f /* '_' */) {
                    alnumsFound = true;
                }
                else if (alnumsFound)
                    break;
            }
            const removedChar = this.toUpperBuf.splice(idx);
            if (this.T.ECHO_P) {
                if (this.T.ECHOPRT_P) {
                    this.startECHOPRT();
                    this.echoToLower(removedChar);
                }
                else if (type == "VERASE" && !this.T.ECHOE_P) {
                    this.echoToLower(this.T.ERASE_V);
                }
                else if (c == utils_1.TAB) {
                    let count = 0;
                    let tabFound = false;
                    for (let idx = this.toUpperBuf.length - 1; idx >= 0; idx--) {
                        const c = this.toUpperBuf[idx];
                        if (c == utils_1.TAB) {
                            tabFound = true;
                            break;
                        }
                        else if ((0, utils_1.iscntrl)(c)) {
                            if (this.T.ECHOCTL_P)
                                count += 2;
                        }
                        else if (this.T.IUTF8_P && (0, utils_1.isUtf8ContinuationByte)(c)) {
                            // ignore
                        }
                        else {
                            count++;
                        }
                    }
                    if (!tabFound)
                        count += this.baseColumn;
                    count = 8 - (count % 8);
                    this.outputToLower(new Array(count).fill(utils_1.BS));
                    this.column = Math.max(0, this.column - count);
                }
                else {
                    if ((0, utils_1.iscntrl)(c) && this.T.ECHOCTL_P) {
                        this.echoToLower([utils_1.BS, utils_1.SP, utils_1.BS], true);
                    }
                    if (!(0, utils_1.iscntrl)(c) || this.T.ECHOCTL_P) {
                        // delete '^' of ECHOCTL
                        this.echoToLower([utils_1.BS, utils_1.SP, utils_1.BS], true);
                    }
                }
            }
            if (type == "VERASE")
                break;
        }
        if (this.toUpperBuf.length == 0) {
            this.clearToUpper();
            if (this.T.ECHO_P)
                this.finishECHOPRT();
        }
    }
    startECHOPRT() {
        if (!this.echoprt) {
            this.echoToLower(92 /* '\' */, true);
            this.echoprt = true;
        }
    }
    finishECHOPRT() {
        if (this.echoprt) {
            this.echoToLower(47 /* '/' */, true);
            this.echoprt = false;
        }
    }
    signal(sig, c) {
        this._onSignalToUpper.fire(sig);
        if (!this.T.NOFLSH_P) {
            this.clearToLower();
            this.clearToUpper();
        }
        if (this.T.IXON_P)
            this.activateFlow();
        if (this.T.ECHO_P)
            this.echoToLower(c);
        this.flushToLower();
    }
    checkStartFlow() {
        if (this.flowActivated == false && this.T.IXON_P && this.T.IXANY_P) {
            this.activateFlow();
            this.flushToLower();
        }
    }
    nextLiteral() {
        this.vlnext = true;
        if (this.T.ECHO_P) {
            this.finishECHOPRT();
            if (this.T.ECHOCTL_P) {
                this.echoToLower([94 /* '^' */, utils_1.BS], true);
                this.flushToLower();
            }
        }
    }
    reprint() {
        this.finishECHOPRT();
        this.echoToLower(this.T.REPRINT_V);
        this.echoToLower(utils_1.NL, true);
        this.echoToLower(this.toUpperBuf);
    }
    writeFromLower(arg) {
        const buf = typeof arg == "string" ? (0, utils_1.stringToUtf8Bytes)(arg) : arg;
        for (let c of buf) {
            if (this.T.ISTRIP_P)
                c &= 0x7f;
            if (this.T.IUCLC_P && this.T.IEXTEN_P)
                c = (0, utils_1.tolower)(c);
            const keyAction = this.vlnext ? "normal" : this.keyActions[c];
            this.vlnext = false;
            switch (keyAction) {
                case "normal":
                    this.checkStartFlow();
                    this.inputFromLowerWithPreprocess(c);
                    break;
                case "VERASE":
                case "VWERASE":
                case "VKILL":
                    this.checkStartFlow();
                    this.erase(keyAction);
                    this.flushToLower();
                    break;
                case "VEOF":
                    this.checkStartFlow();
                    this.flushToUpper();
                    break;
                case "VEOL":
                    this.checkStartFlow();
                    if (this.T.ECHO_P) {
                        this.echoToLower(c);
                        this.flushToLower();
                    }
                    this.outputToUpper(c);
                    this.flushToUpper();
                    break;
                case "VLNEXT":
                    this.checkStartFlow();
                    this.nextLiteral();
                    break;
                case "VREPRINT":
                    this.checkStartFlow();
                    this.reprint();
                    this.flushToLower();
                    break;
                case "VSTART":
                    this.activateFlow();
                    this.flushToLower();
                    break;
                case "VSTOP":
                    this.deactivateFlow();
                    break;
                case "VINTR":
                    this.signal("SIGINT", c);
                    break;
                case "VQUIT":
                    this.signal("SIGQUIT", c);
                    break;
                case "VSUSP":
                    this.signal("SIGTSTP", c);
                    break;
            }
        }
        if (!this.T.ICANON_P) {
            this.flushToUpper();
        }
    }
    writeFromUpper(arg) {
        if (this.flowActivated == false) {
            throw "Do not write anything during flowStatus is stopped";
        }
        const buf = typeof arg == "string" ? (0, utils_1.stringToUtf8Bytes)(arg) : arg;
        for (const c of buf)
            this.outputToLowerWithPostprocess(c);
        this.flushToLower();
    }
}
exports.LineDiscipline = LineDiscipline;
//# sourceMappingURL=lineDiscipline.js.map