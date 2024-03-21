export type ClassConstructor<T> = new (...args: any[]) => T;
export type SerializableType ='Object' | 'Array' | 'Function' | string;
export type SerializableDataType = IDeserializable | string | number | boolean | null;

export interface ISerialized {
    id: string;
    typename: SerializableType;
    data?: {
        [key: string]: SerializableDataType;
    };
    array?: SerializableDataType[];
    param?: SerializableDataType[];
}

export interface ISerializedRef {
    id: string;
}

export interface ISerializedFunction {
    id: string;
    typename: 'Function';
    data?: string;
    param?: IDeserializable[];
    paramDefine?: string[];
    body: string;
}

export type IDeserializable = ISerialized | ISerializedRef | ISerializedFunction;
