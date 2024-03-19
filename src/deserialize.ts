import { SerializableContext } from "./serializable-context";
import { IDeserializable, ISerialized, ISerializedRef } from "./serializable-object";

function deserializeObject(obj: ISerialized, context: SerializableContext): any {
    if (obj.typename === 'Object') {
        const data: any = {};
        context.add(data, obj.id);
        for (const key in obj.data) {
            context.parent = obj.data
            context.parentKey = key;
            data[key] = deserialize(obj.data[key], context);
        }
        return data;
    } else {
        const type = SerializableContext.getType(obj.typename);
        if (!type) {
            throw new Error(`Cannot find the type ${obj.typename}, did you forget to register it?`);
        }
        const instance = new type();
        context.add(instance, obj.id);
        for (const key in obj.data) {
            context.parent = instance;
            context.parentKey = key;
            instance[key] = deserialize(obj.data[key], context);
        }
        return instance;
    }
}

function deserializeArray(obj: ISerialized, context: SerializableContext): any {
    if (obj.typename === 'Array') {
        const data: any[] = [];
        context.add(data, obj.id);
        if (obj.data) {
            for (const key in obj.data) {
                context.parent = obj.data
                context.parentKey = key;
                (data as any)[key] = deserialize(obj.data[key], context);
            }
        }
        
        obj.array!.forEach((item, index)=>{
            context.parent = obj.array
            context.parentKey = index;
            data[index] = deserialize(item, context);
        })
        return data;

    } else {
        const type = SerializableContext.getType(obj.typename);
        if (!type) {
            throw new Error(`Cannot find the type ${obj.typename}, did you forget to register it?`);
        }
        const instance = new type();
        context.add(instance, obj.id);
        if (obj.data) {
            for (const key in obj.data) {
                context.parent = obj.data
                context.parentKey = key;
                instance[key] = deserialize(obj.data[key], context);
            }
        }
        
        obj.array!.forEach((item, index)=>{
            context.parent = obj.array
            context.parentKey = index;
            instance[index] = deserialize(item, context);
        })

        return instance;
    }
}


function deserializeRef(obj: ISerializedRef, context: SerializableContext) {
    const item = context.getFromKey(obj.id);
    if (!item) {
        throw new Error(`Cannot find the reference ${obj.id}, did you forget to add it on extras?`);
    }
    return item;
}

export function deserialize<T>(obj: any, context: SerializableContext = new SerializableContext()): T {
    switch (typeof obj) {
        case 'object':
            const deserializable: IDeserializable = obj;
            if (!deserializable.id) return obj;
            if (!(deserializable as ISerialized).typename)
                return deserializeRef(obj, context);
            const serialized: ISerialized = obj;
            if (serialized.array) {
                const array = deserializeArray(serialized, context);
                return array;
            } else {
                const obj = deserializeObject(serialized, context);
                return obj;
            }

        default:
            return obj;
    }

}