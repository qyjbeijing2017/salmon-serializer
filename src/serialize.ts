import { SerializableContext } from "./serializable-context";
import { SerializableParamMeta } from "./serializable-meta";
import { IDeserializable, ISerialized, ISerializedFunction, ISerializedRef } from "./serializable-object";


function serializeArrayInstance(obj: Array<any>, context: SerializableContext): ISerialized {
    const meta = SerializableContext.getMeta(obj.constructor.name);
    const [id] = context.add(obj, (obj as any).id);

    let param: IDeserializable[] | undefined = undefined;
    if(meta?.paramMeta && meta.paramMeta.length > 0) {
        context.instance = obj;
        param = meta.paramMeta.map((param) => {
            if (typeof param === 'function') {
                return param(context);
            }
            return param;
        }).map((param) => serialize(param, context));
    }

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
        param,
    };
}

function serializeObject(obj: any, context: SerializableContext): ISerialized {
    const meta = SerializableContext.getMeta(obj.constructor.name);
    const [id] = context.add(obj, obj.id);

    let param: IDeserializable[] | undefined = undefined;
    if(meta?.paramMeta && meta.paramMeta.length > 0) {
        context.instance = obj;
        param = meta.paramMeta.map((param) => {
            if (typeof param === 'function') {
                return param(context);
            }
            return param;
        }).map((param) => serialize(param, context));
    }

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
        param,
    }
}

function serializeRef(obj: any, context: SerializableContext): ISerializedRef {
    const id = context.getKeyFromValue(obj)!;
    return { id }
}

function serializeFunction(obj: Function, context: SerializableContext): ISerializedFunction {
    const [id] = context.add(obj, (obj as any).id);
    const output: ISerializedFunction = {
        id,
        typename: 'Function',
    }
    if (context.parent && context.parentKey) {
        const meta = SerializableContext.getMeta(context.parent.constructor.name);
        if (!meta) return output;
        const fieldMeta = meta.getFieldMeta(context.parentKey.toString());
        if (!fieldMeta) return output;
    
        const paramMeta: SerializableParamMeta<any>[] = fieldMeta.paramMeta;
        const invokeParams = paramMeta.map((param) => {
            if (typeof param === 'function') {
                return param(context);
            }
            return param;
        });
        output.param = invokeParams.map((param) => serialize(param, context));
        output.data = obj.bind(context.parent)(...invokeParams);
    } else {
        output.data = obj();
    }
    return output;
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
        case 'function':
            return serializeFunction(obj, context);
        default:
            return obj;
    }
}