import { SerializableContext } from "../serializable-context";
import { SerializableMode } from "../serializable-meta";
import { ClassConstructor } from "../serializable-object";

export interface SerializableOptions {
    mode: SerializableMode;
    toClass?: (value: any, context: SerializableContext) => Promise<any> | any;
    toPlain?: (value: any, context: SerializableContext) => Promise<any> | any;
}

export function Serializable<T extends ClassConstructor<any>>(options: Partial<SerializableOptions> = {}) {
    return (target: T) => {
        const meta = SerializableContext.ensureMeta(target.name);
        meta.type = target;
        if (options.mode !== undefined && options.mode !== null) {
            meta.mode = options.mode;
        }
        meta.toPlain = options.toPlain;
        meta.toClass = options.toClass;
    }
}