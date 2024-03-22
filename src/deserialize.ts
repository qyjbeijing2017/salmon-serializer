import { calculateDeserializableTotalItems } from "./progress";
import { SerializableContext } from "./serializable-context";
import { SerializableMeta, SerializableMode } from "./serializable-meta";
import { IDeserializable, ISerialized, ISerializedFunction, ISerializedRef, SerializableType } from "./serializable-object";

async function deserializeParams(params: any[] | undefined, context: SerializableContext, meta: SerializableMeta<any> | undefined) {
    if (params === undefined) return [];
    return await Promise.all(params.map(async (param, index) => {
        if (meta?.paramMeta[index]?.toClass) {
            return meta.paramMeta[index].toClass!(param, context);
        }
        return deserialize(param, context)
    }));
}

async function deserializeObject(obj: ISerialized, context: SerializableContext): Promise<any> {
    if (obj.typename === 'Object') {
        const data: any = {};
        context.add(data, obj.id);
        for (const key in obj.data) {
            context.parent = data;
            context.parentKey = key;
            data[key] = await deserialize(obj.data[key], context);
        }
        return data;
    } else {
        const type = SerializableContext.getType(obj.typename);
        if (!type) {
            throw new Error(`Cannot find the type ${obj.typename}, did you forget to register it?`);
        }
        const meta = SerializableContext.getMeta(obj.typename);
        const params = await deserializeParams(obj.param, context, meta);
        const instance = new type(...params);
        context.add(instance, obj.id);
        const keys = meta ? meta.getDeserializableKeys(obj.data!) : Object.keys(obj.data!);
        for (const key of keys) {
            context.parent = instance;
            context.parentKey = key;
            const fieldMeta = meta?.getFieldMeta(key);
            if (fieldMeta?.toClass) {
                instance[key] = await fieldMeta.toClass(obj.data![key], context);
            } else {
                instance[key] = await deserialize(obj.data![key], context);
            }
        }
        return instance;
    }
}

async function deserializeArray(obj: ISerialized, context: SerializableContext): Promise<any[]> {
    if (obj.typename === 'Array') {
        const data: any[] = [];
        context.add(data, obj.id);
        if (obj.data) {
            for (const key in obj.data) {
                context.parent = data;
                context.parentKey = key;
                (data as any)[key] = await deserialize(obj.data[key], context);
            }
        }

        await Promise.all(obj.array!.map(async (item, index) => {
            context.parent = obj.array
            context.parentKey = index;
            data[index] = await deserialize(item, context);
        }));
        return data;

    } else {
        const type = SerializableContext.getType(obj.typename);
        if (!type) {
            throw new Error(`Cannot find the type ${obj.typename}, did you forget to register it?`);
        }
        const meta = SerializableContext.getMeta(obj.typename);
        const params = await deserializeParams(obj.param, context, meta);
        const instance = new type(...params);
        context.add(instance, obj.id);
        if (obj.data) {
            const keys = meta ? meta.getDeserializableKeys(obj.data) : Object.keys(obj.data);
            for (const key of keys) {
                context.parent = instance;
                context.parentKey = key;
                const fieldMeta = meta?.getFieldMeta(key);
                if (fieldMeta?.toClass) {
                    instance[key] = await fieldMeta.toClass(obj.data![key], context);
                } else {
                    instance[key] = await deserialize(obj.data![key], context);
                }
            }
        }

        await Promise.all(obj.array!.map(async (item, index) => {
            context.parent = instance;
            context.parentKey = index;
            instance[index] = deserialize(item, context);
        }))

        return instance;
    }
}

async function deserializeFunction(obj: ISerializedFunction, context: SerializableContext): Promise<Function> {
    const func = new Function(
        ...obj.paramDefine || [],
        obj.body
    );
    context.add(func, obj.id);
    if (context.parent && context.parentKey) {
        const meta = SerializableContext.getMeta(context.parent.constructor.name);
        if (!meta) return func;
        const fieldMeta = meta.getFieldMeta(context.parentKey as string);
        if (!fieldMeta) return func;
        const mode = fieldMeta.mode;
        if (mode & SerializableMode.RUN_ON_DESERIALIZE) {
            const params = await deserializeParams(obj.param, context, meta);
            const instance = context.parent;
            func.apply(instance, params);
        }
    }
    return func;
}

function deserializeRef(obj: ISerializedRef, context: SerializableContext) {
    const item = context.getFromKey(obj.id);
    if (!item) {
        throw new Error(`Cannot find the reference ${obj.id}, did you forget to add it on extras?`);
    }
    return item;
}

export async function deserialize<T>(obj: any, context: SerializableContext = new SerializableContext()): Promise<T> {
    let root = false;
    if (!context.loading) {
        context.total = calculateDeserializableTotalItems(obj, context);
        context.loading = true;
        root = true;
        context.lastTick = Date.now();
        if (context.onStart)
            context.onStart(context.total, obj);
    }

    let output: Promise<T> | T;
    switch (typeof obj) {
        case 'object':
            const deserializable: IDeserializable = obj;
            if (!deserializable.id) return obj;
            if (!(deserializable as ISerialized).typename) {
                output = deserializeRef(obj, context);
                break;
            }
            if ((deserializable as ISerializedFunction).typename === 'Function') {
                output = deserializeFunction(obj, context) as Promise<T>;
                break;
            }
            const serialized: ISerialized = obj;
            if (serialized.array) {
                output = deserializeArray(serialized, context) as Promise<T>;
                break;
            } else {
                const now = Date.now();
                if (now - context.lastTick > context.interval) {
                    if (context.onProgress)
                        context.onProgress(context.processed, context.total, obj);
                    context.lastTick = now;
                }
                output = deserializeObject(serialized, context);
                break;
            }
        default:
            context.processed += 1;
            output = obj;
            break;
    }

    await output;
    if (root && context.onFinish) {
        context.onFinish();
        context.loading = false;
    }
    return output;
}