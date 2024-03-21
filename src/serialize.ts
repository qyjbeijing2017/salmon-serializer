import { SerializableContext } from "./serializable-context";
import { SerializableMode, SerializableParamMeta } from "./serializable-meta";
import { IDeserializable, ISerialized, ISerializedFunction, ISerializedRef } from "./serializable-object";


function serializeArrayInstance(obj: Array<any>, context: SerializableContext): ISerialized {
    const meta = obj.constructor ? SerializableContext.getMeta(obj.constructor.name) : undefined;
    const [id] = context.add(obj, (obj as any).id);

    let param: IDeserializable[] | undefined = undefined;
    if (meta?.paramMeta && meta.paramMeta.length > 0) {
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
        typename: obj.constructor ? obj.constructor.name : 'Array',
        data,
        array: array,
        param,
    };
}

function serializeObject(obj: any, context: SerializableContext): ISerialized {
    const meta = obj.constructor ? SerializableContext.getMeta(obj.constructor.name) : undefined;
    const [id] = context.add(obj, obj.id);

    let param: IDeserializable[] | undefined = undefined;
    if (meta?.paramMeta && meta.paramMeta.length > 0) {
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
        typename: obj.constructor ? obj.constructor.name : 'Object',
        data,
        param,
    }
}

function serializeRef(obj: any, context: SerializableContext): ISerializedRef {
    const id = context.getKeyFromValue(obj)!;
    return { id }
}


function runningFunction(obj: Function, context: SerializableContext, serialized: ISerializedFunction) {
    const meta = SerializableContext.getMeta(context.parent.constructor.name);
    if (context.parent && context.parentKey) {
        if (!meta) return;
        const fieldMeta = meta.getFieldMeta(context.parentKey.toString());
        if (!fieldMeta) return;

        const paramMeta: SerializableParamMeta<any>[] = fieldMeta.paramMeta;
        const invokeParams = paramMeta.map((param) => {
            if (typeof param === 'function') {
                return param(context);
            }
            return param;
        });
        serialized.param = invokeParams.map((param) => serialize(param, context));
        serialized.data = obj.bind(context.parent)(...invokeParams);
    } else {
        serialized.data = obj();
    }
}

function serializeFunction(obj: Function, context: SerializableContext): ISerializedFunction {
    const meta = SerializableContext.getMeta(context.parent.constructor.name);
    const metaField = meta?.getFieldMeta(context.parentKey as string);
    const [id] = context.add(obj, (obj as any).id);
    const output: ISerializedFunction = {
        id,
        typename: 'Function',
        body: '',
    };

    const objString = obj.toString();

    const paramDefine = objString.match(/\(([^)]*)\)/);
    if (paramDefine && paramDefine[1]) {
        output.paramDefine = paramDefine[1].split(',').map((param) => param.trim());
    }
    let body = objString.match(/{([^}]*)}/) ?? undefined;
    if (body) {
        output.body = body[1];
    } else {
        body = objString.match(/=>(.*)/) ?? undefined;
        if (body) {
            output.body = `return ${body[1]}`;
        } else {
            output.body = '';
        }
    }

    if (metaField?.mode && metaField?.mode & SerializableMode.RUN_ON_SERIALIZE) {
        runningFunction(obj, context, output);
    }
    return output;
}

export function serialize(obj: any, context: SerializableContext = new SerializableContext()): IDeserializable {
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