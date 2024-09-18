"use strict";
// This module provides a Termios class for termios struct data.
//
// https://man7.org/linux/man-pages/man3/termios.3.html
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTermios = exports.Termios = void 0;
class Termios {
    constructor(iflag, oflag, cflag, lflag, cc) {
        this.iflag = iflag;
        this.oflag = oflag;
        this.cflag = cflag;
        this.lflag = lflag;
        this.cc = cc;
        this.ISTRIP_P = (this.iflag & 32 /* Flags.ISTRIP */) != 0;
        this.INLCR_P = (this.iflag & 64 /* Flags.INLCR */) != 0;
        this.IGNCR_P = (this.iflag & 128 /* Flags.IGNCR */) != 0;
        this.ICRNL_P = (this.iflag & 256 /* Flags.ICRNL */) != 0;
        this.IUCLC_P = (this.iflag & 512 /* Flags.IUCLC */) != 0;
        this.IXON_P = (this.iflag & 1024 /* Flags.IXON */) != 0;
        this.IXANY_P = (this.iflag & 2048 /* Flags.IXANY */) != 0;
        this.IUTF8_P = (this.iflag & 16384 /* Flags.IUTF8 */) != 0;
        this.OPOST_P = (this.oflag & 1 /* Flags.OPOST */) != 0;
        this.OLCUC_P = (this.oflag & 2 /* Flags.OLCUC */) != 0;
        this.ONLCR_P = (this.oflag & 4 /* Flags.ONLCR */) != 0;
        this.OCRNL_P = (this.oflag & 8 /* Flags.OCRNL */) != 0;
        this.ONOCR_P = (this.oflag & 16 /* Flags.ONOCR */) != 0;
        this.ONLRET_P = (this.oflag & 32 /* Flags.ONLRET */) != 0;
        this.TABDLY_XTABS_P = (this.oflag & 6144 /* Flags.TABDLY */) == 6144 /* Flags.XTABS */;
        this.ISIG_P = (this.lflag & 1 /* Flags.ISIG */) != 0;
        this.ICANON_P = (this.lflag & 2 /* Flags.ICANON */) != 0;
        this.ECHO_P = (this.lflag & 8 /* Flags.ECHO */) != 0;
        this.ECHOE_P = (this.lflag & 16 /* Flags.ECHOE */) != 0;
        this.ECHOK_P = (this.lflag & 32 /* Flags.ECHOK */) != 0;
        this.ECHONL_P = (this.lflag & 64 /* Flags.ECHONL */) != 0;
        this.NOFLSH_P = (this.lflag & 128 /* Flags.NOFLSH */) != 0;
        this.ECHOCTL_P = (this.lflag & 512 /* Flags.ECHOCTL */) != 0;
        this.ECHOPRT_P = (this.lflag & 1024 /* Flags.ECHOPRT */) != 0;
        this.ECHOKE_P = (this.lflag & 2048 /* Flags.ECHOKE */) != 0;
        this.IEXTEN_P = (this.lflag & 32768 /* Flags.IEXTEN */) != 0;
        this.INTR_V = this.cc[0 /* Flags.VINTR */];
        this.QUIT_V = this.cc[1 /* Flags.VQUIT */];
        this.ERASE_V = this.cc[2 /* Flags.VERASE */];
        this.KILL_V = this.cc[3 /* Flags.VKILL */];
        this.EOF_V = this.cc[4 /* Flags.VEOF */];
        this.TIME_V = this.cc[5 /* Flags.VTIME */]; // not supported
        this.MIN_V = this.cc[6 /* Flags.VMIN */]; // not supported
        this.SWTCH_V = this.cc[7 /* Flags.VSWTCH */]; // not supported
        this.START_V = this.cc[8 /* Flags.VSTART */];
        this.STOP_V = this.cc[9 /* Flags.VSTOP */];
        this.SUSP_V = this.cc[10 /* Flags.VSUSP */];
        this.EOL_V = this.cc[11 /* Flags.VEOL */];
        this.REPRINT_V = this.cc[12 /* Flags.VREPRINT */];
        this.DISCARD_V = this.cc[13 /* Flags.VDISCARD */]; // not supported
        this.WERASE_V = this.cc[14 /* Flags.VWERASE */];
        this.LNEXT_V = this.cc[15 /* Flags.VLNEXT */];
        this.EOL2_V = this.cc[16 /* Flags.VEOL2 */];
    }
    static fromConfig(config) {
        return new Termios(config.iflag, config.oflag, config.cflag, config.lflag, config.cc);
    }
    clone() {
        return Termios.fromConfig(this);
    }
}
exports.Termios = Termios;
exports.defaultTermios = new Termios(256 /* Flags.ICRNL */ | 1024 /* Flags.IXON */ | 8192 /* Flags.IMAXBEL */ | 16384 /* Flags.IUTF8 */, 1 /* Flags.OPOST */ | 4 /* Flags.ONLCR */, 0x00bf, // c_cflag is not supported
1 /* Flags.ISIG */ |
    2 /* Flags.ICANON */ |
    8 /* Flags.ECHO */ |
    16 /* Flags.ECHOE */ |
    32 /* Flags.ECHOK */ |
    512 /* Flags.ECHOCTL */ |
    2048 /* Flags.ECHOKE */ |
    32768 /* Flags.IEXTEN */, [
    0x03, 0x1c, 0x7f, 0x15, 0x04, 0x00, 0x01, 0x00, 0x11, 0x13, 0x1a, 0x00,
    0x12, 0x0f, 0x17, 0x16, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);
//# sourceMappingURL=termios.js.map