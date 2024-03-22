import { Serializable } from "../src/decorator/serializable";
import { SerializableContext } from "../src/serializable-context";
import { serialize } from "../src/serialize";
import { deserialize } from "../src/deserialize";
import { Ignore } from "../src/decorator/ignore";
import { ISerialized } from "../src/serializable-object";
import { OnSerialized } from "../src/decorator/on-serialized";
import { OnDeserialized } from "../src/decorator/on-deserialized";

describe('onSerialized&onDeserialized',()=>{
    test('class', async () => {
        const onSerialized = jest.fn(()=>{console.log(1)});
    
        @Serializable()
        class ClassUnderTest {
            @Ignore()
            id = 'test';
    
            @Ignore()
            onDeserializedCalled = 0;
    
            @OnSerialized()
            onSerialized() {
            }
    
            @OnDeserialized()
            onDeserialized() {
                this.onDeserializedCalled = 1;
            }
        }
    
        const instanceUnderTest = new ClassUnderTest();
        instanceUnderTest.onSerialized = onSerialized;
        const serializedUnderTest: ISerialized = {
            id: 'test',
            typename: ClassUnderTest.name,
            data: {}
        };
    
        await serialize(instanceUnderTest);
        const deserialized = await deserialize<ClassUnderTest>(serializedUnderTest);
        SerializableContext.removeType(ClassUnderTest);
        
        expect(onSerialized).toHaveBeenCalledTimes(1);
        expect(deserialized.onDeserializedCalled).toBe(1);
    
    })

    test('array', async () => {
        const onSerialized = jest.fn(()=>{console.log(1)});
    
        @Serializable()
        class ClassUnderTest extends Array<number> {
            @Ignore()
            id = 'test';
    
            @Ignore()
            onDeserializedCalled = 0;
    
            @OnSerialized()
            onSerialized() {
            }
    
            @OnDeserialized()
            onDeserialized() {
                this.onDeserializedCalled = 1;
            }
        }
    
        const instanceUnderTest = new ClassUnderTest();
        instanceUnderTest.onSerialized = onSerialized;
        const serializedUnderTest: ISerialized = {
            id: 'test',
            typename: ClassUnderTest.name,
            data: {},
            array: []
        };
    
        await serialize([instanceUnderTest]);
        const deserialized = await deserialize<ClassUnderTest>(serializedUnderTest);
        SerializableContext.removeType(ClassUnderTest);
        
        expect(onSerialized).toHaveBeenCalledTimes(1);
        expect(deserialized.onDeserializedCalled).toBe(1);
    })
})

