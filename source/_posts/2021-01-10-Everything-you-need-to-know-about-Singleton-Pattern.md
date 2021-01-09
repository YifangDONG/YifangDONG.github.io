---
title: Everything you need to know about Singleton Pattern
date: 2021-01-10
lang: en
tags:
	- English writing
	- Java
	- Design pattern
---

## Q1: What is a [singleton pattern ](https://en.wikipedia.org/wiki/Singleton_pattern)and why we need it?

I think most of you know the singleton pattern at least heard about it.  It seems to be the easiest design pattern. For me, it's the first  design pattern that I've learned at school. However, it's not as simple  as it looks like especially there are lots of implementation  concerns. It looks simple because we can use just one simple phrase to  describe it. Singleton pattern ensures us to create one and only one  instance of a class in the memory. A more precise definition in GoF is  that "**Ensure a class only has one instance, and provide a global point of access to it.**"

I don't know what do you think about this definition. For me, when I  first heard about it, I memorized it quickly and couldn't forget it. But now I feel it's strange. Why we need only one instance and global  access to it? Firstly, it doesn't make sense to have a single instance  to save memory. Nowadays, memory is bigger enough for lots of instances. Secondly, global access looks bad to me. It's definitely easy for a  developer to use it, but the cost is very high when you need to find the bug, analyze the dependencies, test your code, etc. Thirdly, the  singleton seems out of fashion. The popular design is to have  multi-instance so that the application has high scalability. After some  search, I finally find a reasonable example to use the singleton  pattern, which is the Windows task manager. We don't need more than one  task manager if they show the same information, that's a pure waste of  resources. It's even worse if a user can open two task managers but has  different information on each. The user will feel confused. I find  another example is the UID generator. In short, all that is to show you  that the singleton pattern has a limited use case.



## Q2: Do you know the two modes to implement the singleton pattern?

Singleton pattern is a creational pattern, which is a hint for us. There are two  ways to implement it: a lazy way and an eager way. What does that mean?

The lazy initialization means the instance of the singleton class is  created when a client wants to use the instance through the global  access method. 

The private constructor prevents any client outside of the class to create an instance of `LazySingleton`. The static field keeps the reference to the single instance of this  class. And the access to this field is published by a public static  method `getInstance()`, which provides a global and unique way to access the instance of `LazySingleton `class. 

```java
public class LazySingleton {

    private static LazySingleton INSTANCE;

    private LazySingleton() {
        // simulate long initialization
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static LazySingleton getInstance() {
        if (INSTANCE == null) {
            INSTANCE = new LazySingleton();
        }
        return INSTANCE;
    }

}
```

The eager initialization means the instance of the singleton class is created at the time of class loading even though the client might not  using it. We need some knowledge about how JVM works to understand what  means "the time of class loading".

Here is a high-level schema to show you the main step for JVM to load class, you can find details of each step in [Java Virtual Machine Specification #Chapter 5. Loading, Linking, and Initializing](https://docs.oracle.com/javase/specs/jvms/se11/html/jvms-5.html)

![JVM class loading](/images/JVM-class-loading.png)

Loading: JVM uses a class loader to attempt to find the binary  representation of a class. Verification checks that the loaded .class is well-formed. Preparation involves the allocation of static storage and  meta-data. Resolution checks the symbolic references from the class  loaded to other classes and interfaces. Initialization executes all  class variable initializers and static initializers of the class.

```java
public class EagerSingleton {

    private static final EagerSingleton INSTANCE = new EagerSingleton();

    private EagerSingleton () {
        // simulate long initialization
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static EagerSingleton getInstance() {
        return INSTANCE;
    }
}
```

Precisely the instance of `EagerSingleton` is created in the step "initializing". And from [Java Language Specification #12.4.2. Detailed Initialization Procedure](https://docs.oracle.com/javase/specs/jls/se11/html/jls-12.html#jls-12.4.2), we know that "The implementation of the Java Virtual Machine is responsible for taking care of synchronization and recursive initialization", so we are sure to have exactly one instance. 



## Q3: How to make lazy initialization thread-safe?

The lazy initialization singleton is not thread-safe. There's a race condition when two threads call `getInstance()`. Both of them will verify that the condition INSTANCE == null is true, so both of them will create a new instance. We can write a simple test to show that.

```java
class SingletonTest {
    @Test
    void LazySingletonIsNotThreadSafe() throws InterruptedException, ExecutionException {
        Callable<LazySingleton> getInstance = LazySingleton::getInstance;
        ExecutorService executorService = Executors.newFixedThreadPool(2);
        List<Future<LazySingleton>> singletonFutures = executorService
            .invokeAll(List.of(getInstance, getInstance));
        assertNotEquals(singletonFutures.get(1).get(), singletonFutures.get(0).get());
    }
}
```

The first solution to avoid race conditions is to add a lock. In java, we use the keyword [**`synchronized`**](https://docs.oracle.com/javase/specs/jls/se11/html/jls-17.html#jls-17.1).

```java
public class ThreadSafeSingleton {

    private static volatile ThreadSafeSingleton INSTANCE;

    private ThreadSafeSingleton () {
    }

    public static synchronized ThreadSafeSingleton getInstance() {
        if (INSTANCE == null) {
            INSTANCE = new ThreadSafeSingleton ();
        }
        return INSTANCE;
    }
}
```

Adding synchronized in the method `getInstance()`means that  every time when a thread wants to get the instance, it first needs to  take the lock. However, the race condition can occur only when the first time to get the instance. We only need to take a lock at that moment.  Once the instance is created, we don't need the synchronization. We know that lock is heavy in java, so we want to reduce the times to take a  lock. That's the main idea of double-checked locking.

```java
public class DoubleCheckLockSingleton {
 
    private static volatile DoubleCheckLockSingleton INSTANCE;
 
    private DoubleCheckLockSingleton() {
    }
 
    public static DoubleCheckLockSingleton getInstance() {
        if (INSTANCE == null) {
            synchronized (DoubleCheckLockSingleton.class) {
                if(INSTANCE == null) {
                    INSTANCE = new DoubleCheckLockSingleton();
                }
            }
        }
        return INSTANCE;
    }
}
```

A detail to note is that we use a keyword **[`volatile`](https://docs.oracle.com/javase/specs/jls/se11/html/jls-8.html#jls-8.3.1.4)** for the field INSTANCE. Why we need that? Because the expression `INSTANCE = new DoubleCheckLockSingleton();` is interpreted into 3 instructions.  And because of the reordering mechanism in CUP, we will not have the  behavior as expected. You can find more illustration in the article [The "Double-Checked Locking is Broken" Declaration](http://www.cs.umd.edu/~pugh/java/memoryModel/DoubleCheckedLocking.html)

```
1. memory = allocate() // allocate memory
2. createInstance(memory) // create instance using the allocated memory
3. INSTANCE = memory // point the INSTANCE to the allocated memory
 
JVM and CPU can reorder the step 2 & 3
1. memory = allocate()
3. INSTANCE = memory
2. createInstance(memory)
 
In this case, when thread 1 finished step 1,3, the INSTANCE == null condition is false, but the instance hasn't been created.
```

JLS defines a [Happens-before Order](https://docs.oracle.com/javase/specs/jls/se11/html/jls-17.html#jls-17.4.5): Two actions can be ordered by a happens-before relationship. If one  action happens-before another, then the first is visible to and ordered  before the second. For a volatile filed, A write to a volatile field  happens-before every subsequent read of that field. This JLS guarantees  that INSTANCE can be seen by other threads only when creating the  instance is finished.



If we go back to study the  initialization part of JLS, we can find another solution to avoid the  race condition. We know that JVM should provide a synchronized and recursive initialization. If we create the instance when declaring the  static field of a class, we can sure that there will be only one  instance. Wait for a minute, do we back to the eager initialization  solution? Not really, we still want the instance is created the moment  the client want to use it. That's means we need to add an indirection.  We want the class contains the instance is initialized when a client  calls the `getInstance()`. An inner static class can help us to achieve that. That's the main idea of the initialization on demand holder. 

```java
public class InitializationOnDemandHolder {
 
    private InitializationOnDemandHolder() {
    }
 
    public static InitializationOnDemandHolder getInstance() {
        return LazyHolder.INSTANCE;
    }
 
    private static class LazyHolder {
        static final InitializationOnDemandHolder INSTANCE = new InitializationOnDemandHolder();
    }
}
```

When the class `InitializationOnDemandHolder `is loaded by the JVM, the class goes through initialization. Since the  class does not have any static variables to initialize, the  initialization completes trivially. The static class definition `LazyHolder` within it is not initialized until the JVM determines that `LazyHolder` must be executed. The static class `LazyHolder` is only executed when the static method `getInstance` is invoked on the class `InitializationOnDemandHolder`, and the first time this happens the JVM will load and initialize the `LazyHolder` class. The initialization of the `LazyHolder` class results in static variable `INSTANCE` being initialized by executing the (private) constructor for the outer class `InitializationOnDemandHolder`. Since the class initialization phase is guaranteed by the JLS to be  sequential, i.e. non-concurrent, no further synchronization is required in the static `getInstance` method during loading and initialization. And since the initialization phase writes the static variable `INSTANCE` in a sequential operation, all subsequent concurrent invocations of the `getInstance` will return the same correctly initialized `INSTANCE` without incurring any additional synchronization overhead. (copy from [wiki ](https://en.wikipedia.org/wiki/Initialization-on-demand_holder_idiom)).



## Q4: Is there a hack to break the restriction?

Yes, we can still hack this class to have more than one instance. Here's the example:

```java
class SingletonTest {
 
    @Test
    void createSingletonWithReflection_getTwoInstances() throws NoSuchMethodException, IllegalAccessException, InvocationTargetException, InstantiationException {
 
        Constructor constructor = LazySingleton.class.getDeclaredConstructor();
        constructor.setAccessible(true);
 
        LazySingleton singleton1 = (LazySingleton)constructor.newInstance();
        LazySingleton singleton2 = (LazySingleton)constructor.newInstance();
 
        assertNotEquals(singleton2, singleton1);
    }
}
```

An enum class can help us to resolve this hack. As it's a hack, this solution is only mentioned here for curiosity.

```java
public enum EnumSingleton {
 
    INSTANCE;
 
    public EnumSingleton getInstance() {
        return INSTANCE;
    }
}
```



## Takeaway

1. Singleton pattern is a pattern to ensure a class only has one instance and  provide a global point of access to it. It has a limited use case.
2. Double-checked locking is a general correct way to implement a lazy initialization singleton.
3. Thanks to JLS, we have Initialization-on-demand holder implementation.