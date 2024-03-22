import { SerializableContext } from "./serializable-context";
import { SerializableDataType } from "./serializable-object";

export function calculateSerializableTotalItems(item: any, context: SerializableContext, calculated: any[] = []): number {
    let total = 0;
    if (typeof item !== 'object') return 1;
    if (calculated.includes(item)) return 0;
    calculated.push(item);
    const meta = item.constructor ? SerializableContext.getMeta(item.constructor.name) : undefined;
    if (meta?.paramMeta) {
        context.instance = item;
        const params = meta.paramMeta.map(param => {
            if (typeof param.findDefault === 'function') {
                return param.findDefault(context);
            }
            return param.findDefault;
        });
        for (const param of params) {
            total += calculateSerializableTotalItems(param, context, calculated);
        }
    }
    const keys = meta?.getSerializableKeys(item) || Object.keys(item);
    for (const key of keys) {
        context.parent = item;
        total += calculateSerializableTotalItems(item[key], context, calculated);
    }
    return total;
}

export function calculateDeserializableTotalItems(item: SerializableDataType, context: SerializableContext): number {
    let total = 0;
    if (typeof item !== 'object') return 1;
    if ((item as any).param) {
        for (const value of (item as any).param) {
            total += calculateDeserializableTotalItems(value, context);
        }
    }
    context.parent = item;
    if ((item as any).data) {
        for (const key in (item as any).data) {
            total += calculateDeserializableTotalItems((item as any).data[key], context);
        }
    }
    if ((item as any).array) {
        for (const value of (item as any).array) {
            total += calculateDeserializableTotalItems(value, context);
        }
    }
    return total;
}