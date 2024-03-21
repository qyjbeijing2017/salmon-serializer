import { SerializableContext } from "../serializable-context";
import { SerializableParamMeta } from "../serializable-meta";

export interface SerializableParamOptions<T> {
    toClass: (value: any, context: SerializableContext) => Promise<T> | T;
    toPlain: (value: T, context: SerializableContext) => Promise<any> | any;
}

export function SerializeParam<T>(val: T | ((context: SerializableContext) => T), options: Partial<SerializableParamOptions<T>> = {}): ParameterDecorator {
    return (target, key, parameterIndex) => {
        if (key) {
            const typename = target.constructor.name;
            const meta = SerializableContext.ensureMeta(typename);
            const fieldMeta = meta.ensureFieldMeta(key.toString());
            fieldMeta.paramMeta[parameterIndex] = new SerializableParamMeta(val);
            if (options.toClass) fieldMeta.paramMeta[parameterIndex].toClass = options.toClass;
            if (options.toPlain) fieldMeta.paramMeta[parameterIndex].toPlain = options.toPlain;
        } else {
            const typename = (target as any).name;
            const meta = SerializableContext.ensureMeta(typename);
            meta.paramMeta[parameterIndex] = new SerializableParamMeta(val);
            if (options.toClass) meta.paramMeta[parameterIndex].toClass = options.toClass;
            if (options.toPlain) meta.paramMeta[parameterIndex].toPlain = options.toPlain;
        }
    }
};