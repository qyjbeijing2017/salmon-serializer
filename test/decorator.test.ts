import { Serializable } from '../src/decorator/serializable';
import { SerializeField } from '../src/decorator/serialize-field';
import { deserialize } from '../src/deserialize';
import { SerializableContext } from '../src/serializable-context';
import { SerializableMode } from '../src/serializable-meta';
import { ISerialized } from '../src/serializable-object';
import { serialize } from '../src/serialize';
import { SerializeParam } from '../src/decorator/serialize-param';

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

    test('function', () => {

        @Serializable()
        class ClassUnderTestRef {
            id: string = 'testRef';
            testNumber: number = 2;
        }

        @Serializable({ mode: SerializableMode.IGNORE })
        class ClassUnderTest {
            id: string = 'test';
            testValue: string = 'test1';
            add: number = 0;
            @SerializeField()
            ref: ClassUnderTestRef;

            constructor(
                @SerializeParam('test2')
                test: string,
                @SerializeParam(ctx => ctx.instance.ref)
                ref: ClassUnderTestRef
            ) {
                this.testValue = test;
                this.ref = ref;
            }

            @SerializeField()
            testRef(
                @SerializeParam(3)
                num: number,
                @SerializeParam(ctx => ctx.parent.ref)
                ref: ClassUnderTestRef
            ) {
                this.add = num + ref.testNumber;
                return this.add;
            }
        }
        const serializedUnderTest: ISerialized = {
            id: `test`,
            typename: ClassUnderTest.name,
            param: [
                'test2',
                {
                    id: 'testRef',
                    typename: ClassUnderTestRef.name,
                    data: {
                        id: 'testRef'
                    }
                }
            ],
            data: {
                ref: {
                    id: 'testRef',
                },
                testRef: {
                    id: 'testRef',
                    typename: "Function",
                    data: 5,
                    param: [
                        3,
                        {
                            id: 'testRef',
                        }
                    ]
                }
            },
        }
        const instanceUnderTest = new ClassUnderTest('test3', new ClassUnderTestRef());

        const serialized = serialize(instanceUnderTest);
        SerializableContext.removeType(ClassUnderTest);

        expect(serialized).toEqual(serializedUnderTest);
    });
});