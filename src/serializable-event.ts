import { Ignore } from "./decorator/ignore";
import { Serializable } from "./decorator/serializable";

@Serializable()
export class SerializableEvent<T extends (...args: any[]) => void> {
    private listeners: {
        listener: T;
        once: boolean;
        target: any;
    }[] = [];

    public addListener(listener: T, target: any = undefined) {
        this.listeners.push({ listener, once: false, target });
    }

    public addOnceListener(listener: T, target: any = undefined) {
        this.listeners.push({ listener, once: true, target });
    }

    public removeListener(listener: T) {
        this.listeners = this.listeners.filter((l) => l.listener !== listener);
    }

    public removeAllListeners() {
        this.listeners = [];
    }

    public emit(...args: Parameters<T>) {
        this.listeners.forEach((l) => {
            l.listener.apply(l.target, args);
            if (l.once) {
                this.removeListener(l.listener);
            }
        });
    }

    @Ignore()
    public invoke = this.emit;
    @Ignore()
    public dispatch = this.emit;
    @Ignore()
    public once = this.addOnceListener;
    @Ignore()
    public on = this.addListener;
    @Ignore()
    public off = this.removeListener;
    @Ignore()
    public offAll = this.removeAllListeners;

}
