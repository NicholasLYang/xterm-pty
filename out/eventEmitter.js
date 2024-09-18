"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = void 0;
class EventEmitter {
    constructor() {
        this.listeners = new Set();
        this.register = this._register.bind(this);
    }
    _register(listener) {
        this.listeners.add(listener);
        return {
            dispose: () => {
                this.listeners.delete(listener);
            }
        };
    }
    fire(arg) {
        for (const listener of this.listeners) {
            try {
                listener(arg);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
}
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=eventEmitter.js.map