import { Serializable } from "../src/decorator/serializable";
import { SerializeParam } from "../src/decorator/serialize-param";
import { SerializableContext } from "../src/serializable-context";
import { serialize } from "../src/serialize";
import { deserialize } from "../src/deserialize";
import { Ignore } from "../src/decorator/ignore";
import { SerializeField } from "../src/decorator/serialize-field";
import { ISerialized } from "../src/serializable-object";
import { SerializableMode } from "../src/serializable-meta";

describe('customize', () => {
    test('exclude & include', async () => {
        @Serializable()
        class ClassUnderTest {
            @Ignore()
            id = 'test';
            @SerializeField({
                toPlain: async (target, context) => {
                    return target + ` customized`;
                }
            })
            name = 'test';
        }
        const instanceUnderTest = new ClassUnderTest();
        const serializedUnderTest: ISerialized = {
            id: 'test',
            typename: 'ClassUnderTest',
            data: {
                name: 'test customized'
            }
        };

        const serialized = await serialize(instanceUnderTest);
        SerializableContext.removeType(ClassUnderTest);

        expect(serialized).toEqual(serializedUnderTest);
    });

    test('deserialize', async () => {
        @Serializable()
        class ClassUnderTest {
            @Ignore()
            id = 'test';
            @SerializeField({
                toClass: async (target, context) => {
                    return target + ` customized`;
                }
            })
            name = 'test';
        }
        const serializedUnderTest: ISerialized = {
            id: 'test',
            typename: 'ClassUnderTest',
            data: {
                name: 'test'
            }
        };
        const instanceUnderTest = await deserialize<ClassUnderTest>(serializedUnderTest);
        SerializableContext.removeType(ClassUnderTest);

        expect(instanceUnderTest.name).toBe('test customized');
    });

    test('param serialized', async () => {
        @Serializable()
        class ClassUnderTest {
            @Ignore()
            id = 'test';

            @SerializeField({ mode: SerializableMode.RUN_AND_SERIALIZE })
            method(@SerializeParam('test', {
                toPlain: async (target, context) => {
                    return target + ` customized`;
                }
            }) param: string) { return param; }
            constructor() {
                (this.method as any).id = 'method';
            }
        }
        const instanceUnderTest = new ClassUnderTest();
        const serializedUnderTest: ISerialized = {
            id: 'test',
            typename: 'ClassUnderTest',
            data: {
                method: {
                    id: 'method',
                    typename: 'Function',
                    paramDefine: ['param'],
                    body: ' return param; ',
                    data: 'test',
                    param: ['test customized']
                }
            }
        };

        const serialized = await serialize(instanceUnderTest);
        SerializableContext.removeType(ClassUnderTest);

        expect(serialized).toEqual(serializedUnderTest);
    })

    test('param deserialized', async () => {
        @Serializable()
        class ClassUnderTest {
            @Ignore()
            id = 'test';

            @SerializeField({ mode: SerializableMode.ALL })
            method(@SerializeParam('test', {
                toClass: async (target, context) => {
                    return target + ` customized`;
                }
            }) param: string) { this.id = param; }
            constructor() {
                (this.method as any).id = 'method';
            }
        }
        const serializedUnderTest: ISerialized = {
            id: 'test',
            typename: 'ClassUnderTest',
            data: {
                method: {
                    id: 'method',
                    typename: 'Function',
                    paramDefine: ['param'],
                    body: ' this.id = param; ',
                    data: 'test',
                    param: ['test']
                }
            }
        };
        const instanceUnderTest = await deserialize<ClassUnderTest>(serializedUnderTest);
        SerializableContext.removeType(ClassUnderTest);

        expect(instanceUnderTest.id).toBe('test customized');
    })

    test('class serialized', async () => {
        @Serializable({
            toPlain: async (target, context) => {
                return `customized class`;
            }
        })
        class ClassUnderTest { }

        @Serializable({
            toPlain: async (target, context) => {
                return `customized class`;
            }
        })
        class ArrayUnderTest extends Array<number> { }

        const instanceUnderTest = new ClassUnderTest();
        const arrayUnderTest = new ArrayUnderTest();

        const serialized = await serialize(instanceUnderTest);
        const arraySerialized = await serialize(arrayUnderTest);

        expect(serialized).toBe('customized class');
        expect(arraySerialized).toBe('customized class');
    });

    test('serialized', async () => {
        const classUnderTest = jest.fn((instance, context)=>{});
        const fieldUnderTest = jest.fn((instance, context)=>{});
        const paramUnderTest = jest.fn((instance, context)=>{});
        @Serializable({
            onSerialized: classUnderTest
        })
        class ClassUnderTest {
            @Ignore()
            id = 'test';
            @SerializeField({
                onSerialized: fieldUnderTest
            })
            name = 'testField';

            constructor(
                @SerializeParam('testParam', {
                    onSerialized: paramUnderTest
                }) param: string
            ) {}
        }
        const serializedUnderTest: ISerialized = {
            id: 'test',
            typename: 'ClassUnderTest',
            param: ['testParam'],
            data: {
                name: 'testField'
            }
        };
        const instanceUnderTest = new ClassUnderTest('test');


        await serialize(instanceUnderTest);

        expect(classUnderTest.mock.calls).toHaveLength(1);
        expect(classUnderTest.mock.calls[0][0]).toEqual(serializedUnderTest);
        expect(fieldUnderTest.mock.calls).toHaveLength(1);
        expect(fieldUnderTest.mock.calls[0][0]).toEqual('testField');
        expect(paramUnderTest.mock.calls).toHaveLength(1);
        expect(paramUnderTest.mock.calls[0][0]).toEqual('testParam');
    });

    test('deserialized', async () => {
        const classUnderTest = jest.fn((instance, context)=>{});
        const fieldUnderTest = jest.fn((instance, context)=>{});
        const paramUnderTest = jest.fn((instance, context)=>{});
        @Serializable({
            onDeserialized: classUnderTest
        })
        class ClassUnderTest {
            @Ignore()
            id = 'test';
            @SerializeField({
                onDeserialized: fieldUnderTest
            })
            name = 'testField';

            constructor(
                @SerializeParam('testParam', {
                    onDeserialized: paramUnderTest
                }) param: string
            ) {}
        }
        const serializedUnderTest: ISerialized = {
            id: 'test',
            typename: 'ClassUnderTest',
            param: ['testParam'],
            data: {
                name: 'testField'
            }
        };
        const instanceUnderTest = new ClassUnderTest('testParam');

        await deserialize<ClassUnderTest>(serializedUnderTest);

        expect(classUnderTest.mock.calls).toHaveLength(1);
        expect(classUnderTest.mock.calls[0][0]).toEqual(instanceUnderTest);
        expect(fieldUnderTest.mock.calls).toHaveLength(1);
        expect(fieldUnderTest.mock.calls[0][0]).toEqual('testField');
        expect(paramUnderTest.mock.calls).toHaveLength(1);
        expect(paramUnderTest.mock.calls[0][0]).toEqual('testParam');

    });
});