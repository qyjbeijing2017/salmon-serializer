# Salmon Serializer

Salmon Serializer is a robust serialization tool for JavaScript, offering easy serialization and deserialization of JavaScript objects, instances, arrays, and functions. It automatically resolves references and circular references, supporting TypeScript decorators for customized serialization processes.



## Table of Contents

- [What is Salmon Serializer?](#what-is-salmon-serializer)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Object](#object)
  - [Instance](#instance)
- [Methods](#methods)
  - [serialize](#serialize)
  - [deserialize](#deserialize)
  - [SerializableContext.register](#serializablecontextregister)
  - [SerializableContext.removeType](#serializablecontextremovetype)
- [SerializableContext](#serializablecontext)
- [SerializableEvent](#serializableevent)
- [Decorators](#decorators)
  - [Serializable](#serializable)
  - [SerializeField](#serializefield)
  - [Ignore](#ignore)
  - [SerializeParam](#serializeparam)



## What is Salmon Serializer?[⬆](#table-of-contents)

With the advancement of web technologies and the new generation of desktop and mobile technologies, JavaScript is taking on increasingly complex tasks such as developing large-scale web applications, desktop applications, and even games. We need a serialization tool more powerful than JSON.

Salmon Serializer is dedicated to serializing and deserializing objects that JSON can't. It handles class objects, references to the same object, circular references, and methods, aiming for perfect serialization and deserialization in complex environments.



## Installation[⬆](#table-of-contents)

```shell
# npm
npm install salmon-serialization
# yarn
yarn add salmon-serialization
```



## Quick Start[⬆](#table-of-contents)

### Object[⬆](#table-of-contents)

```javascript
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

const serialized = await serialize(objectOnTest)

// it will be serialized like this
const serializedOnTest = {
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
        }
    }
}

const deserialized = await deserialize(serialized);

```

### Instance[⬆](#table-of-contents)

```javascript
import { deserialize, serialize, SerializableContext } from 'salmon-serializer';

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

// It will be serialized like this
const serializedOnTest = {
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
        },
        testInstance: {
            id: ``,
            typename: TestSerializationClass2.name,
            data: {
                num: 3,
                str: `str4`,
                bool: false,
            }
        }
    }
}

// Need to register the class first
SerializableContext.register(TestSerializationClass, TestSerializationClass2);

const deserialized = await deserialize(serializedOnTest);
// if your are coding with Typescript
// const deserialized = await deserialize<TestSerializationClass>(serializedOnTest);

// remove the class if you need to
// SerializableContext.removeType(TestSerializationClass, TestSerializationClass2);
```



## Methods[⬆](#table-of-contents)

### serialize[⬆](#table-of-contents)

this method serialize any JavaScript things to simple JavaScript Object, And it is an asynchronous method.

```javascript
import { serialize } from 'salmon-serializer';

// SerializableContext is an optional param
// const serialized = await serialize(anyObject);
const serialized = await serialize(anyObject, new SerializableContext()); 
// ou can output it as json.
conosle.log(JSON.stringify(serialized));
```

### deserialize[⬆](#table-of-contents)

this method deserialize it.

```javascript
import { SerializableContext, deserialize } from 'salmon-serializer';

// SerializableContext is an optional param
// const serialized = await deserialize(serialized);
const deserialized = await deserialize(serialized, new SerializableContext());
```

### SerializableContext.register[⬆](#table-of-contents)

if you need to deserialize any class object you need to register the class first

```javascript
import { SerializableContext } from 'salmon-serializer';

class MyClass {
}

SerializableContext.register(MyClass);

// const myClass = await deserialize(serialized);
// Typescript
// const myClass = await deserialize<MyClass>(serialized);
```

### SerializableContext.removeType[⬆](#table-of-contents)

you can remove the class from register list

```javascript
import { SerializableContext } from 'salmon-serializer';
class MyClass {
}
SerializableContext.register(MyClass);
SerializableContext.removeType(MyClass);
```

## SerializableContext[⬆](#table-of-contents)

`SerializableContext` record all information during serialization or deserialization.  Include meta data of classes, referenced objects, exclude or additional objects and your progress call back function.

 ```javascript
const serialized = await serialize(instanceUnderTest, new SerializableContext({
    // any object you want to exclude, it won't apperance at serialized object, but you need to add it back when you deserialize it.
    extras: {
        excludeObject: excludeObject,
    }
    // OnProgress can't be called again shorter than inverval ms. 
    interval: -1,
    // lifecycle call back functions
    onStart: startUnderTest,
    // onProgress will be called before each class serialization
    onProgress: progressUnderTest,
    onFinish: finishedUnderTest
}));

 ```

## SerializableEvent[⬆](#table-of-contents)

salmon-serializer cannot serialize 'this' pointer of function, so `EventEmitter`  cannot be serialized perfectly. Another way to resolve is Serializable Event.

```typescript
class ClassUnderTest {
    onTest = new SerializableEvent();
    number = 0;
    handle(num) {
        this.number = num;
    }
    constructor() {
        this.onTest.on((num)=>this.handle(num), this);
    }
}

const instanceUnderTest = new ClassUnderTest();
const serialized = await serialize(instanceUnderTest);
const deserialized = await deserialize(serialized);
deserialized.onTest.emit(1); //deserialized number will be 1
```



## Decorators[⬆](#table-of-contents)

if your are coding with Typescript. It is easy to use decorator to customize serialization or deserialization.

```typescript
// use Serializable to instead SerializableContext.register
@Serializable()
class ClassUnderTest {
    // ignore any property
    @Ignore()
    id: string = 'test';
    @Ignore()
    testValue: string = 'test1';
    
    // export accessor
    @SerializeField()
    get test() {
        return 'test';
    }
    set test(value: string) {
        this.testValue = value;
    }
}
```

### Serializable[⬆](#table-of-contents)

it register current class to type list.

```typescript
export enum SerializableMode {
    IGNORE = 0,
    TO_PLAIN_ONLY = 1,
    TO_CLASS_ONLY = 2,
    TO_PLAIN_AND_CLASS = TO_PLAIN_ONLY | TO_CLASS_ONLY,
}

export interface SerializableOptions {
    // you can ignore all properties by setting mode on serlization or deserialization. 
    mode: SerializableMode;
    // you can customized the serialized and deserialized by toClass or toPlain.
    toClass?: (value: any, context: SerializableContext) => Promise<any> | any;
    toPlain?: (value: any, context: SerializableContext) => Promise<any> | any;
    // it will be called on serlization or deserialization, you can do anything else on these call back functions.
    onSerialized?: (instance: SerializableDataType, context: SerializableContext) => Promise<void> | void;
    onDeserialized?: (instance: any, context: SerializableContext) => Promise<void> | void;
}

@Serializable()
class MyClass {}
```



### SerializeField[⬆](#table-of-contents)

you can customized any filed by `SerializeField`, or just tell serializer serialize any properties.

```typescript
export interface SerializableFieldOptions {
    mode: SerializableMode;
    toPlain: (param: any, context: SerializableContext) => Promise<any> | any;
    toClass: (param: any, context: SerializableContext) => Promise<any> | any;
    onSerialized: (instance: SerializableDataType, context: SerializableContext) => Promise<void> | void;
    onDeserialized?: (instance: any, context: SerializableContext) => Promise<void> | void;
}

@Serializable()
class ClassUnderTest {
    // it can serialize accesser as property by SerializeField
    @SerializeField()
    get test() {
        return 'test';
    }
    set test(value: string) {
        this.testValue = value;
    }
}
```

### Ignore[⬆](#table-of-contents)

you can ignore any property by `Ignore`

```typescript
@Serializable()
class ClassUnderTest {
    // ignore any property
    @Ignore()
    id: string = 'test';
}
```

### SerializeParam[⬆](#table-of-contents)

you can set the default param by `SerializeParam`

```typescript
export interface SerializableParamOptions<T> {
    toClass: (value: any, context: SerializableContext) => Promise<T> | T;
    toPlain: (value: T, context: SerializableContext) => Promise<any> | any;
    onSerialized: (instance: SerializableDataType, context: SerializableContext) => Promise<void> | void;
    onDeserialized?: (instance: any, context: SerializableContext) => Promise<void> | void;
}

@Serializable()
class ParentUnderTest {
    id: string = 'parent';
    child: ChildUnderTest;
    constructor() {
        this.child = new ChildUnderTest(this);
    }
}
@Serializable()
class ChildUnderTest {
    id: string = 'child';
    @SerializeField({ mode: SerializableMode.IGNORE })
    parent: ParentUnderTest;
    constructor(
    	// it will export object's 'parent' for default. And you can customlized by options.
        @SerializeParam(ctx => ctx.instance.parent, {})
        parent: ParentUnderTest
         // You can also set a value for default
        @SerializeParam(3)
    	num: number
    ) {
        this.parent = parent;
    }
}
```

