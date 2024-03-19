export type ClassConstructor<T> = new (...args: any[]) => T;
// export const serializableTypes: ClassConstructor<ISerializable>[] = [];

export interface ISerialized {
    id: string;
    typename: string;
    data?: any;
    array?: any[];
}

export interface ISerializedRef {
    id: string;
}

export type IDeserializable = ISerialized | ISerializedRef;

export interface ISerializable{
    id: string;
}
