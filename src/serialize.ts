import { SerializableContext } from "./serializable-context";
import { ISerialized, ISerializedFunction, ISerializedRef } from "./serializable-object";


function serializeArrayInstance(obj: Array<any>, context: SerializableContext): ISerialized {
    const meta = SerializableContext.getMeta(obj.constructor.name);
    const [id] = context.add(obj, (obj as any).id);
    let data: any = undefined;
    let array: any[] | undefined = undefined;
    let index = 0;
    const keys = meta ? meta.getSerializableKeys(obj) : Object.keys(obj);
    for (const key of keys) {
        if (index < obj.length) {
            if (!array) array = [];
            context.parent = obj;
            context.parentKey = index;
            array[index] = serialize(obj[index], context);
            index++;
            continue;
        }
        context.parent = obj;
        context.parentKey = key;
        if (!data) data = {};
        data[key] = serialize((obj as any)[key], context);
    }
    return {
        id,
        typename: obj.constructor.name,
        data,
        array: array,
    };
}

function serializeObject(obj: any, context: SerializableContext): ISerialized {
    const meta = SerializableContext.getMeta(obj.constructor.name);
    const [id] = context.add(obj, obj.id);
    const data: any = {};
    const keys = meta ? meta.getSerializableKeys(obj) : Object.keys(obj);
    for (const key of keys) {
        context.parent = obj;
        context.parentKey = key;
        data[key] = serialize(obj[key], context);
    }
    return {
        id,
        typename: obj.constructor.name,
        data,
    }
}

function serializeRef(obj: any, context: SerializableContext): ISerializedRef {
    const id = context.getKeyFromValue(obj)!;
    return { id }
}

export function serialize(obj: any, context: SerializableContext = new SerializableContext()): any {
    if (context.hasValue(obj)) {
        return serializeRef(obj, context);
    }
    switch (typeof obj) {
        case 'object':
            if (Array.isArray(obj)) {
                return serializeArrayInstance(obj, context);
            }
            return serializeObject(obj, context);
        default:
            return obj;
    }
}