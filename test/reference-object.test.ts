import { deserialize } from "../src/deserialize";
import { ISerialized, ISerializedRef } from "../src/serializable-object";
import { serialize } from "../src/serialize";

describe('reference object', () => {
    const refObjectOnTest = {
        id: `ref`,
        sth: `ref object`
    }
    const objectOnTest = {
        id: `container`,
        sth: `container object`,
        object1: refObjectOnTest,
        object2: refObjectOnTest,
    }

    const serializedOnTest: ISerialized = {
        id: `container`,
        typename: `Object`,
        data: {
            id: `container`,
            sth: `container object`,
            object1: {
                id: `ref`,
                typename: `Object`,
                data: {
                    id: `ref`,
                    sth: `ref object`
                }
            } as ISerialized,
            object2: {
                id: `ref`
            } as ISerializedRef
        }
    }

    test('serialize', () => {
        const serialized = serialize(objectOnTest);

        expect(serialized).toEqual(serializedOnTest);
    })

    test(`deserialize`, () => {
        const deserialized = deserialize(serializedOnTest);

        expect(deserialized).toEqual(objectOnTest);
        expect((deserialized as any).object1).toBe((deserialized as any).object2);
    })

    const loopObject1OnTest = {
        id: `lop1`,
        object2: null as any,
    };
    const loopObject2OnTest = {
        id: 'lop2',
        object1: null as any,
    }
    loopObject1OnTest.object2 = loopObject2OnTest;
    loopObject2OnTest.object1 = loopObject1OnTest;

    const loopSerializedOnTest: ISerialized = {
        id: `lop1`,
        typename: `Object`,
        data: {
            id: `lop1`,
            object2: {
                id: `lop2`,
                typename: `Object`,
                data: {
                    id: `lop2`,
                    object1: {
                        id: `lop1`
                    } as ISerializedRef,
                }
            } as ISerialized,
        }
    }

    test(`loop serialize`, () => {
        const serialized = serialize(loopObject1OnTest);

        expect(serialized).toEqual(loopSerializedOnTest);
    })

    test(`loop deserialize`, ()=>{
        const deserialized = deserialize(loopSerializedOnTest);

        expect(deserialized).toEqual(loopObject1OnTest);
        expect((deserialized as any).object2.object1).toBe(deserialized);
    })
});