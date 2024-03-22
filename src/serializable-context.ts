import { v4 } from "uuid";
import { ClassConstructor } from "./serializable-object";
import { SerializableMeta } from "./serializable-meta";
import { SerializableEvent } from "./serializable-event";

export interface ISerializableContextOptions {
    parent: any;
    parentKey: string | number | Symbol;
    extras: {
        [key: string]: any;
    };
    /**
     * The interval in milliseconds to call the onProgress
     * @default 100
    **/
    interval: number;
    onStart: (total: number, item: any) => void;
    onProgress: (processed: number, total: number, item: any) => void;
    onFinish: () => void;
}

export class SerializableContext {
    onStart?: (total: number, item: any) => void;
    onProgress?: (processed: number, total: number, item: any) => void;
    onFinish?: () => void;
    loading: boolean = false;
    total: number = 0;
    processed: number = 0;
    lastTick: number = 0;
    interval: number = 100;

    static readonly registry: Map<string, SerializableMeta<any>> = new Map();
    static getType(name: string) {
        return this.registry.get(name)?.type;
    }
    static getMeta(name: string) {
        return this.registry.get(name);
    }
    static ensureMeta(name: string) {
        let meta = this.getMeta(name);
        if (!meta) {
            meta = new SerializableMeta();
            this.registry.set(name, meta);
        }
        return meta;
    }
    static register(...types: ClassConstructor<any>[]) {
        types.forEach(type => {
            let meta = this.ensureMeta(type.name);
            meta.type = type;
        });
    }
    static removeType(...types: ClassConstructor<any>[]) {
        types.forEach(type => this.registry.delete(type.name));
    }

    parent: any;
    parentKey: string | number | Symbol | null;
    instance?: any;
    objectContainer: Map<string, any>;
    constructor(options: Partial<ISerializableContextOptions> = {}) {
        this.parent = options.parent ?? null;
        this.parentKey = options.parentKey ?? null;
        this.objectContainer = new Map();
        if (options.extras)
            for (const key in options.extras) {
                this.objectContainer.set(key, options.extras[key]);
            }
        this.interval = options.interval ?? 100;
        if(options.onStart)
            this.onStart = options.onStart;
        if(options.onProgress)
            this.onProgress = options.onProgress;
        if(options.onFinish)
            this.onFinish = options.onFinish;
    }

    hasKey(key: string): boolean {
        return this.objectContainer.has(key);
    }
    hasValue(value: any): boolean {
        return Array.from(this.objectContainer.values()).includes(value);
    }

    getFromKey(key: string): any {
        return this.objectContainer.get(key);
    }
    getKeyFromValue(value: any): string | void {
        for (const [key, val] of this.objectContainer) {
            if (val === value) {
                return key;
            }
        }
    }

    add(value: any, id = v4()): [string, any] {
        this.objectContainer.set(id, value);
        return [id, value];
    }

}