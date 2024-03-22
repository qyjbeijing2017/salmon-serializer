import { SerializableContext } from "../serializable-context";

export function OnSerialized<T>() {
    return (target: any, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
        const typename = target.constructor.name;
        const meta = SerializableContext.ensureMeta(typename);
        if(!propertyKey) {
            throw new Error(`onSerialized must be used on a method`);
        }
        meta.onSerialized = propertyKey;
    };
}
