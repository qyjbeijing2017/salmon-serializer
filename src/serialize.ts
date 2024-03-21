import { SerializableContext } from "./serializable-context";
import { SerializableMeta, SerializableMode, SerializableParamMeta } from "./serializable-meta";
import { IDeserializable, ISerialized, ISerializedFunction, ISerializedRef } from "./serializable-object";


function serializeParam<T extends Object>(meta: SerializableMeta<T> | undefined, context: SerializableContext) {
    if (!meta || meta.paramMeta.length === 0) return;

}


async function serializeArrayInstance(obj: Array<any>, context: SerializableContext): Promise<ISerialized> {
    const meta = obj.constructor ? SerializableContext.getMeta(obj.constructor.name) : undefined;
    const [id] = context.add(obj, (obj as any).id);

    let param: IDeserializable[] | undefined = undefined;
    if (meta?.paramMeta && meta.paramMeta.length > 0) {
        context.instance = obj;
        param = await Promise.all(meta.paramMeta.map((meta) => {
            if (typeof meta.findDefault === 'function') {
                return meta.findDefault(context);
            } [meta.findDefault, meta] as [any, SerializableParamMeta<any>];
            return
        }).map((param) => serialize(param, context)));
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
            array[index] = await serialize(obj[index], context);
            index++;
            continue;
        }
        context.parent = obj;
        context.parentKey = key;
        if (!data) data = {};
        data[key] = await serialize((obj as any)[key], context);
    }
    return {
        id,
        typename: obj.constructor ? obj.constructor.name : 'Array',
        data,
        array: array,
        param,
    };
}

async function serializeObject(obj: any, context: SerializableContext): Promise<ISerialized> {
    const meta = obj.constructor ? SerializableContext.getMeta(obj.constructor.name) : undefined;
    const [id] = context.add(obj, obj.id);

    let param: IDeserializable[] | undefined = undefined;
    if (meta?.paramMeta && meta.paramMeta.length > 0) {
        context.instance = obj;
        param = await Promise.all(meta.paramMeta.map((param) => {
            if (typeof param.findDefault === 'function') {
                return param.findDefault(context);
            }
            return param.findDefault;
        }).map((param) => serialize(param, context)));
    }

    const data: any = {};
    const keys = meta ? meta.getSerializableKeys(obj) : Object.keys(obj);
    for (const key of keys) {
        context.parent = obj;
        context.parentKey = key;
        data[key] = await serialize(obj[key], context);
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

async function runningFunction(obj: Function, context: SerializableContext, serialized: ISerializedFunction) {
    const meta = context.parent.constructor ? SerializableContext.getMeta(context.parent.constructor.name) : undefined;
    if (context.parent && context.parentKey) {
        if (!meta) return;
        const fieldMeta = meta.getFieldMeta(context.parentKey.toString());
        if (!fieldMeta) return;

        const paramMeta: SerializableParamMeta<any>[] = fieldMeta.paramMeta;
        const invokeParams = paramMeta.map((param) => {
            if (typeof param.findDefault === 'function') {
                return param.findDefault(context);
            }
            return param.findDefault;
        });
        serialized.param = await Promise.all(invokeParams.map((param) => serialize(param, context)));
        serialized.data = obj.bind(context.parent)(...invokeParams);
    } else {
        serialized.data = obj();
    }
}

async function serializeFunction(obj: Function, context: SerializableContext): Promise<ISerializedFunction> {

    if (obj.name.startsWith('bound ')) {
        throw new Error('Cannot serialize bound function');
    }

    const meta = context.parent.constructor ? SerializableContext.getMeta(context.parent.constructor.name) : undefined;
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
        await runningFunction(obj, context, output);
    }
    return output;
}

export async function serialize(obj: any, context: SerializableContext = new SerializableContext()): Promise<IDeserializable> {
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