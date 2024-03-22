import { SerializableContext } from "../serializable-context";

export function onDeserialized<T>() {
    return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
        const typename = target.constructor.name;
        const meta = SerializableContext.ensureMeta(typename);
        if(!propertyKey) {
            throw new Error(`onDeserialized must be used on a method`);
        }
        meta.onDeserialized = propertyKey;
    };
}
