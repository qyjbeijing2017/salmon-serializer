import { SerializableContext } from "../src/serializable-context";
import { ISerialized } from "../src/serializable-object";
import { serialize } from "../src/serialize";

describe('serialize simple', () => {

    test('number', () => {
        const numberOnTest = 1.23893;

        const serialized = serialize(numberOnTest);

        expect(serialized).toBeCloseTo(numberOnTest);
    });

    test('string', () => {
        const stringOnTest = `serialize string`;

        const serialized = serialize(stringOnTest);

        expect(serialized).toBe(stringOnTest);
    });

    test('boolean', () => {
        const trueOnTest = true;
        const falseOnTest = false

        const trueSerialized = serialize(trueOnTest);
        const falseSerialized = serialize(falseOnTest);

        expect(trueSerialized).toBe(trueOnTest);
        expect(falseSerialized).toBe(falseOnTest);
    });

    test('array', () => {
        const arrayOnTest: Array<string | number | boolean> = ['str1', 'str2', 'str3', 1, 2, 3, true, false];
        const serializedOnTest: ISerialized = {
            id: ``,
            typename: `Array`,
            array: arrayOnTest,
        }

        const serialized = serialize(arrayOnTest);
        const json = JSON.stringify(serialized);
        serializedOnTest.id = serialized.id;

        expect(json).toBe(JSON.stringify(serializedOnTest));
    })

    test('object', () => {
        const objectOnTest = {
            num: 1,
            str: `2`,
            bool: true,
            object2: {
                num: 3,
                str: `4`,
                bool: false,
            }
        }
        const serializedOnTest: ISerialized = {
            id: ``,
            typename: `Object`,
            data: {
                num: 1,
                str: `2`,
                bool: true,
                object2: {
                    id: ``,
                    typename: `Object`,
                    data: {
                        num: 3,
                        str: `4`,
                        bool: false,
                    }
                } as ISerialized
            }
        }

        const serialized = serialize(objectOnTest);
        const json = JSON.stringify(serialized);
        serializedOnTest.id = serialized.id;
        serializedOnTest.data.object2.id = serialized.data.object2.id;

        expect(json).toBe(JSON.stringify(serializedOnTest));
    })

    test(`object with id`, () => {
        const objectOnTest = {
            id: `ob1`,
            num: 1,
            object2: {
                id: `ob2`,
                num: 2,
            }
        }
        const serializedOnTest: ISerialized = {
            id: `ob1`,
            typename: `Object`,
            data: {
                id: `ob1`,
                num: 1,
                object2: {
                    id: `ob2`,
                    typename: `Object`,
                    data: {
                        id: `ob2`,
                        num: 2,
                    }
                } as ISerialized
            }
        }

        const serialized = serialize(objectOnTest);
        const json = JSON.stringify(serialized);

        expect(json).toBe(JSON.stringify(serializedOnTest));
    })

    test(`class`, () => {
        class TestSerializationClass {
            num = 1;
            str = `str2`;
            bool = true;
            testObject = {
                id: `ob1`,
                sth: `testObject`,
            }
            testInstance = new TestSerializationClass2();
        }
        class TestSerializationClass2 {
            num = 3;
            str = `str4`;
            bool = false;
        }
        const instanceOnTest = new TestSerializationClass();
        const serializedOnTest: ISerialized = {
            id: ``,
            typename: TestSerializationClass.name,
            data: {
                num: 1,
                str: `str2`,
                bool: true,
                testObject: {
                    id: `ob1`,
                    typename: `Object`,
                    data: {
                        id: `ob1`,
                        sth: `testObject`,
                    }
                } as ISerialized,
                testInstance: {
                    id: ``,
                    typename: TestSerializationClass2.name,
                    data: {
                        num: 3,
                        str: `str4`,
                        bool: false,
                    }
                } as ISerialized
            }
        }


        SerializableContext.register(TestSerializationClass, TestSerializationClass2);
        const serialized = serialize(instanceOnTest);
        const json = JSON.stringify(serialized);
        serializedOnTest.id = serialized.id;
        serializedOnTest.data.testInstance.id = serialized.data.testInstance.id;
        SerializableContext.removeType(TestSerializationClass, TestSerializationClass2);

        expect(json).toBe(JSON.stringify(serializedOnTest));
    })

    test(`class with id`, ()=>{
        class TestSerializationClassWithID {
            id = `ts1`;
            sth = `123`;
        }    
        const instanceOnTest = new TestSerializationClassWithID();
        const serializedOnTest: ISerialized = {
            id: `ts1`,
            typename: TestSerializationClassWithID.name,
            data: {
                id: `ts1`,
                sth: `123`,
            }
        }

        SerializableContext.register(TestSerializationClassWithID);
        const serialized = serialize(instanceOnTest);
        const json = JSON.stringify(serialized);
        SerializableContext.removeType(TestSerializationClassWithID);

        expect(json).toBe(JSON.stringify(serializedOnTest));
    })
    
});
