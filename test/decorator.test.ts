import { Serializable } from '../src/decorator/serializable';
import { SerializeField } from '../src/decorator/serialize-field';
import { deserialize } from '../src/deserialize';
import { SerializableContext } from '../src/serializable-context';
import { SerializableMode } from '../src/serializable-meta';
import { ISerialized } from '../src/serializable-object';
import { serialize } from '../src/serialize';
import { SerializeParam } from '../src/decorator/serialize-param';
import EventEmitter from 'events';

describe(`simple decorator`, () => {
    test(`@Serializable`, () => {
        @Serializable()
        class ClassUnderTest {
        }
        expect(SerializableContext.getType(ClassUnderTest.name)).toBe(ClassUnderTest);
        SerializableContext.removeType(ClassUnderTest);
    });

    test('ignore', () => {
        @Serializable({ mode: SerializableMode.IGNORE })
        class ClassUnderTest {
            @SerializeField()
            id: string = 'test';

            @SerializeField()
            field1: string = 'test1';

            @SerializeField({ mode: SerializableMode.TO_PLAIN_ONLY })
            field2: string = 'test2';

            @SerializeField({ mode: SerializableMode.TO_CLASS_ONLY })
            field3: string = 'test3';

            field4: string = 'test4';

        }
        const serializedUnderTest: ISerialized = {
            id: `test`,
            typename: ClassUnderTest.name,
            data: {
                id: `test`,
                field1: `test1`,
                field2: `test2`,
            }
        }
        const deserializedUnderTest: ISerialized = {
            id: `test`,
            typename: ClassUnderTest.name,
            data: {
                id: `test`,
                field1: `test1`,
                field2: `test5`,
                field3: `test3`,
                field4: `test8`,
            }
        }
        const instanceUnderTest = new ClassUnderTest();

        const serialized = serialize(instanceUnderTest);
        const deserialized = deserialize(deserializedUnderTest);
        SerializableContext.removeType(ClassUnderTest);

        expect(serialized).toEqual(serializedUnderTest);
        expect(deserialized).toEqual(instanceUnderTest);
    });

    test('accessor', () => {
        @Serializable()
        class ClassUnderTest {
            @SerializeField({ mode: SerializableMode.IGNORE })
            id: string = 'test';
            @SerializeField({ mode: SerializableMode.IGNORE })
            testValue: string = 'test1';

            @SerializeField()
            get test() {
                return 'test';
            }

            set test(value: string) {
                // do nothing
                this.testValue = value;
            }
        }
        const serializedUnderTest: ISerialized = {
            id: `test`,
            typename: ClassUnderTest.name,
            data: {
                test: `test`,
            }
        }
        const instanceUnderTest = new ClassUnderTest();

        const serialized = serialize(instanceUnderTest);
        const deserialized = deserialize<ClassUnderTest>(serializedUnderTest);
        SerializableContext.removeType(ClassUnderTest);

        expect(serialized).toEqual(serializedUnderTest);
        expect(deserialized.testValue).toBe('test');
    });

    test('functions & ref', () => {
        @Serializable()
        class ClassUnderTestRef {
            id: string = 'testRef';
            @SerializeField()
            mul(a: number, b: number) { return a * b; }
        }
        @Serializable()
        class ClassUnderTest {
            id: string = 'test';
            testNumber: number = 2;
            arrow = (a: number, b: number) => a + b;
            @SerializeField()
            fun() { return 2; }
            constructor() {
                (this.arrow as any).id = 'testArrow';
                (this.fun as any) = this.ref.mul;
                (this.fun as any).id = 'testFun';

            }
            ref: ClassUnderTestRef = new ClassUnderTestRef();
        }

        const serializedUnderTest: ISerialized = {
            id: `test`,
            typename: ClassUnderTest.name,
            data: {
                id: `test`,
                testNumber: 2,
                arrow: {
                    id: 'testArrow',
                    typename: 'Function',
                    paramDefine: ['a', 'b'],
                    body: 'return  a * b'
                },
                ref: {
                    id: 'testRef',
                    typename: ClassUnderTestRef.name,
                    data: {
                        id: 'testRef',
                        mul: {
                            id: 'testFun',
                            typename: 'Function',
                            paramDefine: ['a', 'b'],
                            body: ' return a * b; '
                        }
                    }
                },
                fun: {
                    id: 'testFun',
                }
            }
        }
        const instanceUnderTest = new ClassUnderTest();
        instanceUnderTest.arrow = (a: number, b: number) => a * b;
        (instanceUnderTest.arrow as any).id = 'testArrow';
        const serialized = serialize(instanceUnderTest);
        const deserialized = deserialize<ClassUnderTest>(serializedUnderTest);
        SerializableContext.removeType(ClassUnderTest);
        SerializableContext.removeType(ClassUnderTestRef);

        expect(serialized).toEqual(serializedUnderTest);
        expect(deserialized.testNumber).toBe(2);
        expect(deserialized.arrow(1, 2)).toBe(2);
        expect((deserialized.fun as any)(3, 4)).toBe(12);
    });

    test('run', () => {
        @Serializable()
        class ClassUnderTest {
            id: string = 'test';
            number1: number = 2;
            @SerializeField({ mode: SerializableMode.ALL })
            mul(
                @SerializeParam(3)
                a: number,
                @SerializeParam(ctx => ctx.parent.number1)
                b: number
            ) { return a * b; }

            constructor() {
                (this.mul as any).id = 'testFun';
            }
        }
        const instanceUnderTest = new ClassUnderTest();
        const serializedUnderTest: ISerialized = {
            id: `test`,
            typename: ClassUnderTest.name,
            data: {
                id: `test`,
                number1: 2,
                mul: {
                    id: 'testFun',
                    typename: 'Function',
                    paramDefine: ['a', 'b'],
                    body: ' return a * b; ',
                    param: [3, 2],
                    data: 6,
                },
            }
        }

        const serialized = serialize(instanceUnderTest);
        const deserialized = deserialize<ClassUnderTest>(serializedUnderTest);
        SerializableContext.removeType(ClassUnderTest);

        expect(serialized).toEqual(serializedUnderTest);
        expect(deserialized.mul(3, 2)).toBe(6);
    })

    test('constructor', () => {
        
    });

});