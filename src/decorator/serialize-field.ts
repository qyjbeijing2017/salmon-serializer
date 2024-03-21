import { SerializableContext } from "../serializable-context";
import { SerializableFieldType, SerializableMode } from "../serializable-meta";

export interface SerializableFieldOptions {
    mode: SerializableMode;
    toPlain: (param: any, context: SerializableContext) => Promise<any>;
    toClass: (param: any, context: SerializableContext) => Promise<any>;
}

export function SerializeField<T>(options: Partial<SerializableFieldOptions> = {}) {
    return (target: any, key: string, descriptor?: TypedPropertyDescriptor<T>) => {
        const typename = target.constructor.name;
        const meta = SerializableContext.ensureMeta(typename);
        const fieldMeta = meta.ensureFieldMeta(key);
        if (options.mode !== undefined && options.mode !== null) {
            fieldMeta.mode = options.mode;
            if(options.mode & SerializableMode.RUN_ON_SERIALIZE  && !descriptor) {
                throw new Error(`Field must be a method to run mode`);
            }
        }
        if (descriptor) {
            fieldMeta.type = SerializableFieldType.METHOD;
            if (descriptor.get) {
                fieldMeta.type |= SerializableFieldType.GETTER;
            }
            if (descriptor.set) {
                fieldMeta.type |= SerializableFieldType.SETTER;
            }
        }
        fieldMeta.toPlain = options.toPlain;
        fieldMeta.toClass = options.toClass;
    }
}
