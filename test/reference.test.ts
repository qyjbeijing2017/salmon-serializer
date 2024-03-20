import { deserialize } from "../src/deserialize";
import { SerializableContext } from "../src/serializable-context";
import { ISerialized, ISerializedRef } from "../src/serializable-object";
import { serialize } from "../src/serialize";

describe('reference object', () => {
    const refObjectUnderTest = {
        id: `ref`,
        sth: `ref object`
    }
    const objectUnderTest = {
        id: `container`,
        sth: `container object`,
        object1: refObjectUnderTest,
        object2: refObjectUnderTest,
    }

    const serializedUnderTest: ISerialized = {
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
        const serialized = serialize(objectUnderTest);

        expect(serialized).toEqual(serializedUnderTest);
    })

    test(`deserialize`, () => {
        const deserialized = deserialize(serializedUnderTest);

        expect(deserialized).toEqual(objectUnderTest);
        expect((deserialized as any).object1).toBe((deserialized as any).object2);
    })

    const loopObject1UnderTest = {
        id: `lop1`,
        object2: null as any,
    };
    const loopObject2UnderTest = {
        id: 'lop2',
        object1: null as any,
    }
    loopObject1UnderTest.object2 = loopObject2UnderTest;
    loopObject2UnderTest.object1 = loopObject1UnderTest;

    const loopSerializedUnderTest: ISerialized = {
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
        const serialized = serialize(loopObject1UnderTest);

        expect(serialized).toEqual(loopSerializedUnderTest);
    })

    test(`loop deserialize`, () => {
        const deserialized = deserialize(loopSerializedUnderTest);

        expect(deserialized).toEqual(loopObject1UnderTest);
        expect((deserialized as any).object2.object1).toBe(deserialized);
    })

    class Parent {
        id: string = `parent`;
        children: Child[] = [];
    }
    class Child {
        id: string = ``;
        parent: Parent = null as any;
    }
    const parentUnderTest = new Parent();
    const child1UnderTest = new Child(), child2UnderTest = new Child();
    child1UnderTest.id = `child1`;
    child2UnderTest.id = `child2`;
    child1UnderTest.parent = parentUnderTest;
    child2UnderTest.parent = parentUnderTest;
    parentUnderTest.children = [child1UnderTest, child2UnderTest];
    (parentUnderTest.children as any).id = `children`;
    const loopClassSerializedUnderTest: ISerialized = {
        id: `parent`,
        typename: Parent.name,
        data: {
            id: `parent`,
            children: {
                id: `children`,
                typename: `Array`,
                data: {
                    id: `children`
                },
                array: [
                    {
                        id: `child1`,
                        typename: `Child`,
                        data: {
                            id: `child1`,
                            parent: {
                                id: `parent`
                            } as ISerializedRef,
                        }
                    },
                    {
                        id: `child2`,
                        typename: `Child`,
                        data: {
                            id: `child2`,
                            parent: {
                                id: `parent`
                            } as ISerializedRef,
                        }
                    }
                ] as ISerialized[]
            } as ISerialized,
        }
    }

    test(`serialize loop class`, () => {
        const serialized = serialize(parentUnderTest);
        expect(serialized).toEqual(loopClassSerializedUnderTest);
    })

    test(`deserialize loop class`, () => {
        SerializableContext.register(Parent, Child);
        const deserialized = deserialize<Parent>(loopClassSerializedUnderTest);
        SerializableContext.removeType(Parent, Child);

        expect(deserialized).toEqual(parentUnderTest);
        expect(deserialized).toBe(deserialized.children[0].parent);
        expect(deserialized).toBe(deserialized.children[1].parent);
    })

});