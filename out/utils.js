"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToUtf8Bytes = exports.toupper = exports.tolower = exports.isUtf8ContinuationByte = exports.iscntrl = exports.isalnum = exports.SP = exports.CR = exports.NL = exports.TAB = exports.BS = void 0;
exports.BS = 8;
exports.TAB = 9;
exports.NL = 10;
exports.CR = 13;
exports.SP = 32;
const isalnum = (c) => (0x30 <= c && c <= 0x39) ||
    (0x41 <= c && c <= 0x5a) ||
    c == 0x5f ||
    (0x61 <= c && c <= 0x7a);
exports.isalnum = isalnum;
const iscntrl = (c) => (0x00 <= c && c <= 0x1f && c != 0x09) || c == 0x7f;
exports.iscntrl = iscntrl;
const isUtf8ContinuationByte = (c) => (c & 0xc0) == 0x80;
exports.isUtf8ContinuationByte = isUtf8ContinuationByte;
const tolower = (c) => (0x41 <= c && c <= 0x5a ? c + 0x20 : c);
exports.tolower = tolower;
const toupper = (c) => (0x61 <= c && c <= 0x7a ? c - 0x20 : c);
exports.toupper = toupper;
const utf8Encoder = new TextEncoder();
const stringToUtf8Bytes = (str) => Array.from(utf8Encoder.encode(str));
exports.stringToUtf8Bytes = stringToUtf8Bytes;
//# sourceMappingURL=utils.js.map