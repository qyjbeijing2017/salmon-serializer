import { SerializableContext } from "../serializable-context";

export function SerializeParam<T>(val: T | ((context: SerializableContext) => T)): ParameterDecorator {
    return (target, key, parameterIndex) => {
        if (key) {
            const typename = target.constructor.name;
            const meta = SerializableContext.ensureMeta(typename);
            const fieldMeta = meta.ensureFieldMeta(key.toString());
            fieldMeta.paramMeta[parameterIndex] = val;
        } else {
            const typename = (target as any).name;
            const meta = SerializableContext.ensureMeta(typename);
            meta.paramMeta[parameterIndex] = val;
        }
    }
};