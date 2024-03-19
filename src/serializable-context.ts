import { v4 } from "uuid";
import { ClassConstructor } from "./serializable-object";

export interface ISerializableContextOptions {
    parent: any;
    parentKey: string | number | Symbol;
    source: any;
    extras: any;
}

export class SerializableContext {
    static readonly registry: Map<string, ClassConstructor<any>> = new Map();
    static getType(name: string) {
        return this.registry.get(name);
    }
    static register(...types: ClassConstructor<any>[]) {
        types.forEach(type => this.registry.set(type.name, type));
    }
    static removeType(...types: ClassConstructor<any>[]) {
        types.forEach(type => this.registry.delete(type.name));
    }

    parent: any;
    parentKey: string | number | Symbol | null;
    source: any;
    objectContainer: Map<string, any>;
    constructor(options: Partial<ISerializableContextOptions> = {}) {
        this.parent = options.parent ?? null;
        this.parentKey = options.parentKey ?? null;
        this.source = options.source ?? {};
        this.objectContainer = new Map();
        if (options.extras)
            for (const key in options.extras) {
                this.objectContainer.set(key, options.extras[key]);
            }
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