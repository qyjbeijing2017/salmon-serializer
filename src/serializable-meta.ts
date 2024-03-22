import { SerializableContext } from "./serializable-context";
import { ClassConstructor, SerializableDataType } from "./serializable-object";

export enum SerializableMode {
    IGNORE = 0,
    TO_PLAIN_ONLY = 1,
    TO_CLASS_ONLY = 2,
    TO_PLAIN_AND_CLASS = TO_PLAIN_ONLY | TO_CLASS_ONLY,
    RUN_ON_DESERIALIZE = 4,
    RUN_ON_SERIALIZE = 8,
    RUN_ON_BOTH = RUN_ON_DESERIALIZE | RUN_ON_SERIALIZE,
    RUN_AND_SERIALIZE = RUN_ON_SERIALIZE | TO_PLAIN_ONLY,
    RUN_AND_DESERIALIZE = RUN_ON_DESERIALIZE | TO_CLASS_ONLY,
    ALL = TO_PLAIN_AND_CLASS | RUN_ON_BOTH,
}

export enum SerializableFieldType {
    METHOD = 0,
    GETTER = 1,
    SETTER = 2,
    ACCESSOR = 3,
    PROPERTY = 4,
}

export class SerializableFieldMeta {
    mode: SerializableMode = SerializableMode.TO_PLAIN_AND_CLASS;
    type: SerializableFieldType = SerializableFieldType.PROPERTY;
    paramMeta: SerializableParamMeta<any>[] = [];
    toClass?: (value: any, context: SerializableContext) => Promise<any> | any;
    toPlain?: (value: any, context: SerializableContext) => Promise<any> | any;
    onSerialized?: (instance: SerializableDataType, context: SerializableContext) => Promise<void> | void;
    onDeserialized?: (instance: any, context: SerializableContext) => Promise<void> | void;
}

export class SerializableParamMeta<T>{
    readonly findDefault: T | ((context: SerializableContext) => T);
    toClass?: (value: any, context: SerializableContext) => Promise<T> | T;
    toPlain?: (value: T, context: SerializableContext) => Promise<any> | any;
    onSerialized?: (instance: SerializableDataType, context: SerializableContext) => Promise<void> | void;
    onDeserialized?: (instance: T, context: SerializableContext) => Promise<void> | void;
    constructor(findDefault: T | ((context: SerializableContext) => T)) {
        this.findDefault = findDefault;
    }
}

export class SerializableMeta<T extends Object> {
    type?: ClassConstructor<T>;
    mode: SerializableMode = SerializableMode.TO_PLAIN_AND_CLASS;
    readonly keysMeta: Map<string, SerializableFieldMeta> = new Map();
    paramMeta: SerializableParamMeta<any>[] = [];
    toClass?: (value: any, context: SerializableContext) => Promise<T> | T;
    toPlain?: (value: T, context: SerializableContext) => Promise<any> | any;
    onSerialized?: symbol | string | ((instance: SerializableDataType, context: SerializableContext) => Promise<void> | void);
    onDeserialized?: symbol | string | ((instance: T, context: SerializableContext) => Promise<void> | void);
    ensureFieldMeta(key: string) {
        let meta = this.keysMeta.get(key);
        if (!meta) {
            meta = new SerializableFieldMeta();
            this.keysMeta.set(key, meta);
        }
        return meta;
    }

    getFieldMeta(key: string) {
        return this.keysMeta.get(key);
    }

    removeFieldMeta(key: string) {
        this.keysMeta.delete(key);
    }

    clearFieldMeta() {
        this.keysMeta.clear();
    }

    isSerializable(key: string) {
        const meta = this.keysMeta.get(key);
        const mode = meta?.mode ?? this.mode;
        return mode & SerializableMode.TO_PLAIN_ONLY ?? mode & SerializableMode.RUN_ON_SERIALIZE ? true : false;
    }

    isDeserializable(key: string) {
        const meta = this.keysMeta.get(key);
        const mode = meta?.mode ?? this.mode;
        return mode & SerializableMode.TO_CLASS_ONLY ?? mode & SerializableMode.RUN_ON_DESERIALIZE ? true : false;
    }

    getSerializableKeys(instance: T) {
        const keys: Set<string> = new Set(Object.keys(instance).concat(...this.keysMeta.keys()));
        for (const key of keys) {
            if (!this.isSerializable(key)) {
                keys.delete(key);
            }
        }
        return Array.from(keys);
    }

    getDeserializableKeys(serialized: {
        [key: string]: SerializableDataType;
    }) {
        const keys: Set<string> = new Set(Object.keys(serialized).concat(...this.keysMeta.keys()));
        for (const key of keys) {
            if (!this.isDeserializable(key)) {
                keys.delete(key);
            }
        }
        return Array.from(keys);
    }
}
