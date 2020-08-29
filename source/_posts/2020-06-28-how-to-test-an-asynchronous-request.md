---
title: How to test an asynchronous request
date: 2020-06-28
lang: en
tags:
	- English writing
	- Java
	- 测试
	- Concurrency
---

One day, I need to write some offline integration tests for our server. To simplify, our server looks as follows: It contains two layers. The session layer subscribes to the server layer to be able to receive the notification. When the client requests something from the server, it will be notified later. What I should test is triggering an action from the client and then verify the notification. Here comes the problem, because each layer executes the notification in its `ExecutorService`, I don't know when to check the notification from the client.

![system under test](/images/test-asynchronous-request-describe-problem.png)

To simplify again, let's say on the server-side I only have one layer called `MyServer` which can `addListener` and `doAction`:

```java
interface Listener {
    void onNotified (String notification);
}
 
interface Server {
    void addListener(Listener listener);
    void doAction(String action);
}
     
class MyServer implements Server {
    ExecutorService executor = Executors.newSingleThreadExecutor();
    volatile Optional<Listener> listener = Optional.empty();
 
    @Override
    public void doAction(String action) {
        // Image here are some complex domain logic
        listener.ifPresent(listener ->
            executor.submit(() -> listener.onNotified(action))
        );
    }
     
    @Override
    public void addListener(Listener listener) {
        this.listener = Optional.of(listener);
    }
}
```

I create a client to test `MyServer`. It implements the interface `Listener` which can subscribe to a server, call the server to do an action, and get notified.

````java
class Client implements Listener {
    String lastNotification;
    Server server;
 
    @Override
    public void onNotified(String notification) {
        lastNotification = notification;
    }
 
    public void subscribe(Server server) {
        this.server = server;
        this.server.addListener(this);
    }
 
    public String getLastNotification() {
        return lastNotification;
    }
 
    public void doAction(String action) {
        server.doAction(action);
    }
}
````

The test is simple: when the client called `doAction("Hello")`, I want to check it is notified by "Hello"

````java
@Test
public void theBasicTest() {
    Client client = new Client();
    Server myServer = new MyServer();
    client.subscribe(myServer);
    client.doAction("hello");
    assertEquals("hello", client.getLastNotification());
}
````
If I run the test directly, I will get the error:
```
java.lang.AssertionError:
Expected :hello
Actual :null
```
So what should I do for this test?

<!-- more -->

### Solution1: Thread.sleep()

`client.getLastNotification()` return null because that `client.doAction("hello")` and `assertEquals("hello", client.getLastNotification())` are executed in the main thread while the server notifies the client in another thread. So when `assertEquals` is called, the server hasn't notified the client yet. The solution looks simple, I just need to wait a certain time before doing the assertion to let the server have enough time to notify the client. Just like this:

````java
@Test
public void solution_ThreadSleep() throws InterruptedException {
    Client client = new Client();
    Server myServer = new MyServer();
    client.subscribe(myServer);
    client.doAction("hello");
    Thread.sleep(1000);
    assertEquals("hello", client.getLastNotification());
}
````

It's the simplest solution but the disadvantage is also evident. I don't know perfectly how long should I wait. Imagine I have dozens of or even hundreds of tests like that I don't want to wait for a half-hour to run all the tests. On the other hand, I can't put a small-time slot just enough to pass the test on my local machines. Because the machines have different powers. It's enough for mine does not mean it's enough for others. Even worse, the waiting time is enough when the machine is free doesn't mean it's enough when it's busy. That also the main reason for the random test failure. I need to find a more stable solution. 

### Solution2: CountDownLatch

I need to find a solution that allows the client to synchronize `doAction`, `onNotified` and `getLastNotification`. Fortunately, I have a perfect helper in the `java.util.concurrent` package: the [CountDownLatcher ](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/CountDownLatch.html)class.

> A synchronization aid that allows one or more threads to wait until a set of operations being performed in other threads completes.

What I want is when the main thread called `getLastNotification`, it waits until the `onNotified` from another thread is called.

````java
class Client implements Listener {
    String lastNotification;
    Server server;
    CountDownLatch countDownLatch;
 
    @Override
    public void onNotified(String notification) {
        lastNotification = notification;
    }
 
    public void subscribe(Server server) {
        this.server = server;
        this.server.addListener(this);
    }
 
    public String getLastNotification() {
        countDownLatch.await(10, TimeUnit.SECONDS);
        return lastNotification;
    }
 
    public void doAction(String action) {
        countDownLatch = new CountDownLatch(1);
        server.doAction(action);
    }
}
````

I initialize the countDownLatch with a count 1 when `doAction` is called. In `getLastNotification` the [`await`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/CountDownLatch.html#await()) method blocks until the current count reaches zero. The count reaches zero due to the invocation of the [`countDown()`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/CountDownLatch.html#countDown()) method in `onNotified`

### Solution3: CompletableFuture

If I think about the problem slightly differently, I can find another solution. I don't need to block the main thread when I try to call `getLastNotification`. I just need to retrieve the value of the last notification. In other words, the main thread can still do whatever it wants. Another class in the `java.util.concurrent` package, [CompletableFuture](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/CompletableFuture.html), can help me to achieve that.

> A [`Future`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/Future.html) that may be explicitly completed (setting its value and status), and may be used as a [`CompletionStage`](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/CompletionStage.html), supporting dependent functions and actions that trigger upon its completion.

````java
class Client implements Listener {
    CompletableFuture<String> lastNotification;
    Server server;
 
    @Override
    public void onNotified(String notification) {
        lastNotification.complete(notification);
    }
 
    public void subscribe(Server server) {
        this.server = server;
        this.server.addListener(this);
    }
 
    public String getLastNotification() {
        return lastNotification.get(1, TimeUnit.SECONDS);
    }
 
    public void doAction(String action) {
        lastNotification = new CompletableFuture<>();
        server.doAction(action);
    }
}
````

The implementation is quite similar to the `CountDownLatch` one. When the client calls `doAction`, I create a `CompletableFuture` `lastNotification` which represents a task that can be used to get its value in the future. The task is waiting for the notification. When the client is notified, I set the result to the `lastNotification` by using the method [complete](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/CompletableFuture.html#complete(T)). In the `getLastNotification`, I use the method [get](https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/util/concurrent/CompletableFuture.html#get(long,java.util.concurrent.TimeUnit)) to get the result of the `CompletableFuture`. Indeed I don't benefit a lot by this powerful class `CompletableFuture` because when I get the value from `lastNotification`, it's already a blocking call. The power of the `CompletableFuture` is that we can create a chain of several tasks that will be executed synchronously or asynchronously in a default thread or a dedicated thread.

### Final Solution: Rethink about the design

I'm always happy when I've found a solution to deal with a problem especially when the problem seems difficult. But finding a solution is not the end, I need to ask myself why I have to face this annoying problem. Because sometimes, the true problem is hidden behind the symptom.

> A: "Why we should deal with this asynchronous problem while we just want to test our functional logic."
>
> B: "Because we have a separate thread to execute notification."
>
> A: "Why we need this separate thread?"
>
> B: "Because in reality, the notification takes time. In the production code, the server should notify dozens of subscribed clients and we want to have a good performance for that. "
>
> A: "But in the test, we don't care about the performance, right? We only care about the functional logic is correct or not."
>
> B: "Yes, exactly,"
>
> A: "So what should we do?"
>
> B: "Maybe re-design MyServer to be able to have different behavior between the production context and the test context. Well...I should be able to inject this ExecutorService."
>
> A: "Bingo!"

After rethinking the problem, I can find another solution to deal with this problem: Inject the `ExecutorService` into `MyServer` to avoid dealing with the asynchronous problem.

````java
interface Listener {
    void onNotified (String notification);
}
 
interface Server {
    void addListener(Listener listener);
    void doAction(String action);
}
     
class MyServer implements Server {
    ExecutorService executor;
    volatile Optional<Listener> listener = Optional.empty();
 
    public MyServer(ExecutorService executor) {
        this.executor = executor;
    }
 
    @Override
    public void doAction(String action) {
        // Image here are some complex domain logic
        listener.ifPresent(listener ->
            executor.submit(() -> listener.onNotified(action))
        );
    }
     
    @Override
    public void addListener(Listener listener) {
        this.listener = Optional.of(listener);
    }
}
 
@Test
public void solution_RedesignTheServer() {
    Client client = new Client();
    Server myServer = new MyServer(MoreExecutors.newDirectExecutorService());
    client.subscribe(myServer);
    client.doAction("hello");
    assertEquals("hello", client.getLastNotification());
}
````

[MoreExecutors](https://guava.dev/releases/23.5-jre/api/docs/com/google/common/util/concurrent/MoreExecutors.html#newDirectExecutorService--) is a [guava](https://github.com/google/guava/wiki) utility. [MoreExecutors.newDirectExecutorService()](https://guava.dev/releases/23.5-jre/api/docs/com/google/common/util/concurrent/MoreExecutors.html#newDirectExecutorService--) tells `MyServer` to execute the task in the calling thread, which is the main thread. Now in the test, there's only one thread. I don't need to deal with the asynchronous problem.

### Conclusion

As a Java developer, I should know how to use classes like `CountDownLatch`, `CompletableFuture`, `ExecutorService` to deal with asynchronous. In this blog, I use a simplified use case to show how to use them. On the other hand, we can see asynchronous is not simple, sometimes with another design, we can avoid dealing with it.