import { Serializable } from "../src/decorator/serializable";
import { SerializeParam } from "../src/decorator/serialize-param";
import { SerializableContext } from "../src/serializable-context";
import { serialize } from "../src/serialize";
import { deserialize } from "../src/deserialize";
import { Ignore } from "../src/decorator/ignore";
import exp from "constants";
import { ISerialized } from "../src/serializable-object";

describe('context', () => {
    @Serializable()
    class ClassUnderTest {
        @Ignore()
        id: string = 'class1'
        num1: number = 1;
        num2: number = 2;
        num3: number = 3;
        array: ClassUnderTest2[] = [new ClassUnderTest2(this, 'class2-1'), new ClassUnderTest2(this, 'class2-2')];
        class2: ClassUnderTest2 = new ClassUnderTest2(this, 'class2-3');
        constructor() {
            (this.array as any).id = 'array';
        }
    }
    @Serializable()
    class ClassUnderTest2 {
        @Ignore()
        id: string = 'class2'
        num3: number = 4;
        num4: number = 5;
        num5: number = 6;
        ref: ClassUnderTest
        constructor(
            @SerializeParam(ctx => ctx.instance.ref) ref: ClassUnderTest,
            @SerializeParam(ctx => ctx.instance.id) id: string = 'class2',
        ) {
            this.id = id;
            this.ref = ref;
        }
    }
    const instanceUnderTest = new ClassUnderTest();
    const serializedUnderTest: ISerialized = {
        id: 'class1',
        typename: ClassUnderTest.name,
        data: {
            num1: 1,
            num2: 2,
            num3: 3,
            array: {
                id: 'array',
                typename: 'Array',
                data: {
                    id: 'array',
                },
                array: [
                    {
                        id: 'class2-1',
                        typename: ClassUnderTest2.name,
                        param: [
                            {
                                "id": "class1",
                            },
                            "class2-1"
                        ],
                        data: {
                            num3: 4,
                            num4: 5,
                            num5: 6,
                            ref: {
                                id: 'class1',
                            }
                        }
                    },
                    {
                        id: 'class2-2',
                        typename: ClassUnderTest2.name,
                        param: [
                            {
                                "id": "class1",
                            },
                            "class2-2"
                        ],
                        data: {
                            num3: 4,
                            num4: 5,
                            num5: 6,
                            ref: {
                                id: 'class1',
                            }
                        }
                    }
                ]
            },
            class2: {
                id: 'class2-3',
                typename: ClassUnderTest2.name,
                param: [
                    {
                        "id": "class1",
                    },
                    "class2-3"
                ],
                data: {
                    num3: 4,
                    num4: 5,
                    num5: 6,
                    ref: {
                        id: 'class1',
                    }
                }
            }
        }
    }
    const totalUnderTest = 16;


    test('serialize', async () => {
        const startUnderTest = jest.fn((total, item) => { });
        const progressUnderTest = jest.fn((progressed, total, item) => { });
        const finishedUnderTest = jest.fn(() => { });

        const serialized = await serialize(instanceUnderTest, new SerializableContext({
            // onProgress will be called before each class serialization
            interval: -1,
            onStart: startUnderTest,
            onProgress: progressUnderTest,
            onFinish: finishedUnderTest
        }));

        expect(serialized).toEqual(serializedUnderTest);
        expect(startUnderTest.mock.calls).toHaveLength(1);
        expect(startUnderTest.mock.calls[0][0]).toBe(totalUnderTest);
        expect(startUnderTest.mock.calls[0][1]).toBe(instanceUnderTest);
        expect(progressUnderTest.mock.calls).toHaveLength(4);
        expect(progressUnderTest.mock.calls[0][0]).toBe(0);
        expect(progressUnderTest.mock.calls[0][1]).toBe(totalUnderTest);
        expect(progressUnderTest.mock.calls[0][2]).toBe(instanceUnderTest);
        expect(progressUnderTest.mock.calls[1][0]).toBe(3);                         // class1 num1, num2, num3 has been serialized
        expect(progressUnderTest.mock.calls[1][1]).toBe(totalUnderTest);
        expect(progressUnderTest.mock.calls[1][2]).toBe(instanceUnderTest.array[0]);
        expect(progressUnderTest.mock.calls[2][0]).toBe(7);                         // class2-1 num3, num4, num5, and constructor param2 id has been serialized
        expect(progressUnderTest.mock.calls[2][1]).toBe(totalUnderTest);
        expect(progressUnderTest.mock.calls[2][2]).toBe(instanceUnderTest.array[1]);
        expect(progressUnderTest.mock.calls[3][0]).toBe(12);                        // class2-2 num3, num4, num5, constructor param2 id, and array's id has been serialized
        expect(progressUnderTest.mock.calls[3][1]).toBe(totalUnderTest);
        expect(progressUnderTest.mock.calls[3][2]).toBe(instanceUnderTest.class2);
        expect(finishedUnderTest.mock.calls).toHaveLength(1);
    });


    test('deserialize', async () => {
        const startUnderTest = jest.fn((total, item) => { });
        const progressUnderTest = jest.fn((progressed, total, item) => { });
        const finishedUnderTest = jest.fn(() => { });

        const deserialized = await deserialize<ClassUnderTest>(serializedUnderTest, new SerializableContext({
            // onProgress will be called before each class serialization
            interval: -1,
            onStart: startUnderTest,
            onProgress: progressUnderTest,
            onFinish: finishedUnderTest
        }));

        expect(deserialized).toBeInstanceOf(ClassUnderTest);
        expect(deserialized).toEqual(instanceUnderTest);
        expect(startUnderTest.mock.calls).toHaveLength(1);
        expect(startUnderTest.mock.calls[0][0]).toBe(totalUnderTest);
        expect(startUnderTest.mock.calls[0][1]).toBe(serializedUnderTest);
        expect(progressUnderTest.mock.calls).toHaveLength(4);
        expect(progressUnderTest.mock.calls[0][0]).toBe(0);
        expect(progressUnderTest.mock.calls[0][1]).toBe(totalUnderTest);
        expect(progressUnderTest.mock.calls[0][2]).toBe(serializedUnderTest);
        expect(progressUnderTest.mock.calls[1][0]).toBe(4);                         
        expect(progressUnderTest.mock.calls[1][1]).toBe(totalUnderTest);
        expect(progressUnderTest.mock.calls[2][0]).toBe(5);                         
        expect(progressUnderTest.mock.calls[2][1]).toBe(totalUnderTest);
        expect(progressUnderTest.mock.calls[3][0]).toBe(12);                   
        expect(progressUnderTest.mock.calls[3][1]).toBe(totalUnderTest);
        expect(finishedUnderTest.mock.calls).toHaveLength(1);
    });

});