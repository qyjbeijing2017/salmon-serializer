import { Serializable } from "../src/decorator/serializable";
import { SerializeParam } from "../src/decorator/serialize-param";
import { SerializableContext } from "../src/serializable-context";
import { serialize } from "../src/serialize";
import { deserialize } from "../src/deserialize";
import { Ignore } from "../src/decorator/ignore";

describe('context', () => {
    test('exclude & include', async () => {
        class ExcludeClassUnderTest {
        }
        @Serializable()
        class ClassUnderTest {
            @Ignore()
            id: string = 'test';
            @Ignore()
            exclude: ExcludeClassUnderTest;
            constructor(
                @SerializeParam(ctx => ctx.instance.exclude)
                exclude: ExcludeClassUnderTest
            ) {
                this.exclude = exclude;
            }
        }
        const excludeInstance = new ExcludeClassUnderTest();
        const instance = new ClassUnderTest(excludeInstance);
        const serializedUnderTest = {
            id: `test`,
            typename: ClassUnderTest.name,
            param: [{
                id: `exclude`,
            }],
            data: {}
        }
        const contextUnderTest = new SerializableContext({
            extras: {
                exclude: excludeInstance
            }
        });

        const serialized = await serialize(instance, contextUnderTest);
        const deserialized = await deserialize<ClassUnderTest>(serialized, contextUnderTest);

        expect(serialized).toEqual(serializedUnderTest);
        expect(deserialized.exclude).toBe(excludeInstance);
    });
});