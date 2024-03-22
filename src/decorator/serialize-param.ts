import { SerializableContext } from "../serializable-context";
import { SerializableParamMeta } from "../serializable-meta";
import { SerializableDataType } from "../serializable-object";

export interface SerializableParamOptions<T> {
    toClass: (value: any, context: SerializableContext) => Promise<T> | T;
    toPlain: (value: T, context: SerializableContext) => Promise<any> | any;
    onSerialized: (instance: SerializableDataType, context: SerializableContext) => Promise<void> | void;
    onDeserialized?: (instance: any, context: SerializableContext) => Promise<void> | void;
}

export function SerializeParam<T>(val: T | ((context: SerializableContext) => T), options: Partial<SerializableParamOptions<T>> = {}): ParameterDecorator {
    return (target, key, parameterIndex) => {
        if (key) {
            const typename = target.constructor.name;
            const meta = SerializableContext.ensureMeta(typename);
            const fieldMeta = meta.ensureFieldMeta(key.toString());
            fieldMeta.paramMeta[parameterIndex] = new SerializableParamMeta(val);
            fieldMeta.paramMeta[parameterIndex].toClass = options.toClass;
            fieldMeta.paramMeta[parameterIndex].toPlain = options.toPlain;
            fieldMeta.paramMeta[parameterIndex].onSerialized = options.onSerialized;
            fieldMeta.paramMeta[parameterIndex].onDeserialized = options.onDeserialized;
        } else {
            const typename = (target as any).name;
            const meta = SerializableContext.ensureMeta(typename);
            meta.paramMeta[parameterIndex] = new SerializableParamMeta(val);
            meta.paramMeta[parameterIndex].toClass = options.toClass;
            meta.paramMeta[parameterIndex].toPlain = options.toPlain;
            meta.paramMeta[parameterIndex].onSerialized = options.onSerialized;
            meta.paramMeta[parameterIndex].onDeserialized = options.onDeserialized;
        }
    }
};