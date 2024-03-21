import { Serializable } from "./decorator/serializable";
import { SerializeField } from "./decorator/serialize-field";
import { SerializableMode } from "./serializable-meta";

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

    @SerializeField({ mode: SerializableMode.IGNORE })
    public invoke = this.emit;
    @SerializeField({ mode: SerializableMode.IGNORE })
    public once = this.addOnceListener;
    @SerializeField({ mode: SerializableMode.IGNORE })
    public on = this.addListener;
    @SerializeField({ mode: SerializableMode.IGNORE })
    public off = this.removeListener;
    @SerializeField({ mode: SerializableMode.IGNORE })
    public offAll = this.removeAllListeners;
}