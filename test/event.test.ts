import EventEmitter from "events";
import { Serializable } from "../src/decorator/serializable";
import { serialize } from "../src/serialize";
import { SerializableContext } from "../src/serializable-context";
import { deserialize } from "../src/deserialize";
import { SerializableEvent } from "../src/serializable-event";

describe('event', () => {

    test('event Emitter', async () => {
        @Serializable()
        class ClassUnderTest {
            emitter = new EventEmitter();
            handle(num: number) {
                return num;
            }
            constructor() {
                this.emitter.on('test', this.handle);
            }
        }
        const instanceUnderTest = new ClassUnderTest();

        SerializableContext.register(EventEmitter);
        const serialized = await serialize(instanceUnderTest);
        const deserialized = await deserialize<ClassUnderTest>(serialized);
        instanceUnderTest.emitter.emit('test', 1);
        SerializableContext.removeType(EventEmitter);
        SerializableContext.removeType(ClassUnderTest);

        expect(deserialized.emitter.emit('test', 1)).toBe(true);
    });

    test('event Emitter with bind', async () => {
        @Serializable()
        class ClassUnderTest {
            emitter = new EventEmitter();
            handle(num: number) {
                return num;
            }
            constructor() {
                this.emitter.on('test', this.handle.bind(this));
            }
        }
        const instanceUnderTest = new ClassUnderTest();

        SerializableContext.register(EventEmitter);
        expect(async () => await serialize(instanceUnderTest)).rejects.toThrow();
        SerializableContext.removeType(EventEmitter);
    });

    test('event', async () => {
        @Serializable()
        class ClassUnderTest {
            onTest = new SerializableEvent<(num: number) => void>();
            number = 0;
            handle(num: number) {
                this.number = num;
            }
            constructor() {
                this.onTest.on(this.handle, this);
            }
        }
        const instanceUnderTest = new ClassUnderTest();

        const serialized = await serialize(instanceUnderTest);
        const deserialized = await deserialize<ClassUnderTest>(serialized);
        deserialized.onTest.emit(1);

        expect(deserialized.number).toBe(1);
    })
});