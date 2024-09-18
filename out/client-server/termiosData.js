"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataToTermios = exports.termiosToData = void 0;
const termios_1 = require("../termios");
const termiosToData = (termios) => {
    const data = [termios.iflag, termios.oflag, termios.cflag, termios.lflag];
    let word = 0;
    let offset = 8;
    for (let i = 0; i < termios.cc.length; i++) {
        word |= termios.cc[i] << offset;
        offset += 8;
        if (offset == 32) {
            data.push(word);
            word = 0;
            offset = 0;
        }
    }
    data.push(word);
    return data;
};
exports.termiosToData = termiosToData;
const dataToTermios = (data) => {
    const cc = [];
    let ptr = 4;
    let word = data[ptr++];
    let offset = 8;
    for (let i = 0; i < 32; i++) {
        cc.push((word >> offset) & 0xff);
        offset += 8;
        if (offset >= 32) {
            word = data[ptr++];
            offset = 0;
        }
    }
    return new termios_1.Termios(data[0], data[1], data[2], data[3], cc);
};
exports.dataToTermios = dataToTermios;
//# sourceMappingURL=termiosData.js.map