import { calculateSerializableTotalItems } from "./progress";
import { SerializableContext } from "./serializable-context";
import { SerializableMeta, SerializableMode, SerializableParamMeta } from "./serializable-meta";
import { IDeserializable, ISerialized, ISerializedFunction, ISerializedRef } from "./serializable-object";

async function serializeParam<T extends Object>(meta: SerializableMeta<T> | undefined, context: SerializableContext) {
    if (!meta || meta.paramMeta.length === 0) return;
    const output: any[] = [];
    for (const param of meta.paramMeta) {
        let value: any;
        if (typeof param.findDefault === 'function') {
            value = param.findDefault(context);
        } else {
            value = param.findDefault;
        }
        if (param.toPlain) {
            value = await param.toPlain(value, context);
        } else {
            const serialized = await serialize(value, context);
            output.push(serialized);
        }
    }
    return output;
}

async function serializeArrayInstance(obj: Array<any>, context: SerializableContext): Promise<ISerialized> {
    const meta = obj.constructor ? SerializableContext.getMeta(obj.constructor.name) : undefined;
    const [id] = context.add(obj, (obj as any).id);

    if(meta && meta.toClass) {
        return meta.toClass(obj, context);
    }

    context.instance = obj;
    let param: IDeserializable[] | undefined = undefined;
    if (meta?.paramMeta && meta.paramMeta.length > 0) {
        param = await serializeParam(meta, context);
    }

    let data: any = undefined;
    let array: any[] | undefined = undefined;
    let index = 0;
    const keys = meta ? meta.getSerializableKeys(obj) : Object.keys(obj);
    context.parent = obj;
    for (const key of keys) {
        if (index < obj.length) {
            if (!array) array = [];
            context.parentKey = index;

            const fieldMeta = meta?.getFieldMeta(key);
            if (fieldMeta?.toPlain) {
                array[index] = await fieldMeta.toPlain(obj[index], context);
            } else {
                array[index] = await serialize(obj[index], context);
            }
            index++;
            continue;
        }
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

    if(meta && meta.toClass) {
        return meta.toClass(obj, context);
    }

    let param: IDeserializable[] | undefined = undefined;
    if (meta?.paramMeta && meta.paramMeta.length > 0) {
        context.instance = obj;
        param = await serializeParam(meta, context);
    }

    context.parent = obj;
    const data: any = {};
    const keys = meta ? meta.getSerializableKeys(obj) : Object.keys(obj);
    for (const key of keys) {
        context.parentKey = key;
        const fieldMeta = meta?.getFieldMeta(key);
        if (fieldMeta?.toPlain) {
            data[key] = await fieldMeta.toPlain(obj[key], context);
        } else {
            data[key] = await serialize(obj[key], context);
        }
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
        serialized.param = await Promise.all(invokeParams.map((param, index) => {
            const meta = paramMeta[index];
            if (meta.toPlain) {
                return meta.toPlain(param, context);
            }
            return serialize(param, context);
        }));
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
    let root = false;
    if (!context.loading) {
        context.total = calculateSerializableTotalItems(obj, context);
        context.loading = true;
        root = true;
        context.lastTick = Date.now();
        if (context.onStart)
            context.onStart(context.total, obj);
    }

    if (context.hasValue(obj)) {
        return serializeRef(obj, context);
    }

    let output: Promise<IDeserializable> | IDeserializable;
    switch (typeof obj) {
        case 'object':
            if (Array.isArray(obj)) {
                output = serializeArrayInstance(obj, context);
                break;
            }
            const now = Date.now();
            if (now - context.lastTick > context.interval) {
                if (context.onProgress)
                    context.onProgress(context.processed, context.total, obj);
                context.lastTick = now;
            }
            output = serializeObject(obj, context);
            break;
        case 'function':
            output = serializeFunction(obj, context);
            break;
        default:
            context.processed += 1;
            output = obj;
            break;
    }

    await output;
    if (root && context.onFinish){
        context.onFinish();
        context.loading = false;
    }
    return output;

}
