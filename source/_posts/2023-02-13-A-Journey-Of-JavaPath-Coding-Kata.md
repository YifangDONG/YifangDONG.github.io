---
title: A Journey Of JavaPath Coding Kata
date: 2021-12-20 
lang: en
tags:
    - Java
    - Kata
---

In this blog, I'll share with you an interesting coding exercise organized by my colleague (Coach_A). This exercise takes around one hour and a half. I'll write down how it was going and what I've learned from it.

## Warm-up

The coding yoga starts with the question "what is the [JsonPath](https://goessner.net/articles/JsonPath/)"? I never heard about this concept. Coach_A explains to us that the JsonPath is a query language for Json. A JsonPath expression specifies a path to an element in a JSON structure. We can get the element by evaluating the JsonPath on a Json structure. He also shows some examples using an online JsonPath evaluator.

Next Coach_A gives us the exercise. Basically, we need to implement a simplified "JavaPath" evaluator which can query the value of a given object. The JavaPath syntax is like "attribute1.attribute2.attribute3". Here Colleague_D asks an interesting question "Where do you find this exercise?" Coach_A tells us the story that in his work, he needs to write a fixture for the FitNesse test, where they need to assert a specific value in a general object.

> The best training material comes from our daily work. However, creating an exercise to illustrate a real problem that we can face during daily work requires me to think consciously. I should extract the core problem, remove the context, and specific constrain details to create the exercise to practice.

Coach_A asks us to give an estimation on this exercise. It looks like this exercise is not easy because I don't have a clear algorithm in my mind. I just have a blur idea that I need to parse the path to get the field name and use reflection to get the value of an object. There are also corner cases and errors to deal with. I doubt that I can have a working solution in 1 hour. For me, if it's asked in an interview, it will not be an easy question. While in the end, it's not as complicated as I thought.

## Implementation

Firstly, we need to define an API. Colleague_C proposes the following API:

```java
public class Main {

    public static Object testJavaPath(String path, Object instance) {
        return null;
    }
}
```

We have some discussions on the API and the implementation. Many questions flashed in my mind: should we encapsulate the instance and do some indexing on its attributes, because we may want to query different values on the same object and we can have better performance if we have the indexing? Should we create a class to represent the path because we may want to enrich the path syntax later? what if the path has syntax errors? If we have a Path class, we can do the syntax check there. Is it better to have a generic type on the method? In fact, it's not a good start to ask those questions, because it doesn't help me to find where to start. On the contrary, they make me lose focus.

At this point, Coach_A says that he just wants a simple solution and we agree on this API. We should start to implement it.

I don't feel confident to start the implementation so I propose to add some tests first. Personally, I don't do TDD systematically in the daily work and don't do the standard TDD (only add one test each time), because usually the difficulty in the daily work is to find a correct way to integrate a solution and TDD doesn't help for that. But here, **adding tests is a helper for me to understand the problem, review the API, and have time to think about the implementation** (Sometimes, the way I test the code already gives me a hint on how to implement it).

The first test is that we have only one class and all the attributes are having a simple type.

```java
public class Main {

    public static Object testJavaPath(String path, Object instance) {
        return null;
    }

    public static void main(String[] args) {
        User user = new User(1, "Bob");
        System.out.println(testJavaPath("name", user));
    }

    public record User(int id, String name) {
    }
}

```

Colleague_B proposes a simple solution that from the instance, we can create a map with the field name as a key and the evaluated object as a value. Once we have this map, we can query on it and if the field doesn't exist, which means the path has an error, we just return null. The implementation is quite quick, and we have a first working version.

```java
public class Main {

    public static Object testJavaPath(String path, Object instance) {
        Map<String, Object> fieldToValue = Arrays.stream(instance.getClass().getDeclaredFields())
            .collect(Collectors.toMap(
                Field::getName,
                field -> {
                    try {
                        return field.get(instance);

                    } catch (IllegalAccessException e) {
                        throw new RuntimeException(e);
                    }
                }));
        return fieldToValue.get(path);

    }

    public static void main(String[] args) {
        User user = new User(1, "Bob");
        System.out.println(testJavaPath("name", user));
        System.out.println(testJavaPath("street", user));
    }

    public record User(int id, String name) {
    }

}

```

Starting with a simple solution means that we focus on the main problem and accept writing some ugly code or taking shortcuts on unimportant parts. What's important is being conscious and adding TODOs to not forget to improve them later. Even if you are strong enough and have a habit to write code clearly and quickly, it's still valuable to focus on the main problem. **For me, "keep it simple, stupid" emphasize focusing on the main problem.**

Next, we need to implement the JavaPath for the composite class. I'm thinking about how to implement it while Coach_A is writing the test classes.

```java
public class Main {

    public static Object testJavaPath(String path, Object instance) {
        Map<String, Object> fieldToValue = Arrays.stream(instance.getClass().getDeclaredFields())
            .collect(Collectors.toMap(
                Field::getName,
                field -> {
                    try {
                        return field.get(instance);
                    } catch (IllegalAccessException e) {
                        throw new RuntimeException(e);
                    }
                }));

        return fieldToValue.get(path);

    }

    public static void main(String[] args) {

        User user = new User(1, "Bob",
            new Address(
                new Country(
                    "France",
                    250,
                    "FR",
                    "FRA"
                ),
                "Paris",
                new Street(
                    "Assas",
                    21
                )
            ));
        System.out.println(testJavaPath("name", user));
        System.out.println(testJavaPath("address", user));
        System.out.println(testJavaPath("address.country", user));
        System.out.println(testJavaPath("address.country.name", user));
    }

    public record User(int id, String name, Address address) {
    }

    public record Address(Country country, String city, Street street) {
    }

    public record Street(String name, int number) {
    }

    public record Country(String name, int iso3166Numeric, String iso3166alpha2, String iso3166Alpha3) {
    }

}

```

The first idea in my mind is to create a complete map with all possible paths and their value. The key set of the map should contain the enumeration of all possible paths.

Colleague_C says that we don't care about other fields so why not recursive call this testJavaPath method? Yes, he's right and it's much more straightforward to implement a recursive solution. No need to worry about how to go through the composite class to create a flat map. He starts to implement the recursive method. **For a recursive call, there are 2 key points to implement: the return condition and how to update the input parameter**. Colleague_C implements that when the path is null or empty, we can return the instance, which is the expected value. However because the remote control doesn't work well, I take over the implementation and follow his idea. Then we have the first complete solution:

```java
public class Main {

    public static Object testJavaPath(String path, Object instance) {
        if (path == null || path.isEmpty() || instance == null) {
            return instance;
        }
        Map<String, Object> fieldToValue = Arrays.stream(instance.getClass().getDeclaredFields())
            .collect(Collectors.toMap(
                Field::getName,
                field -> {
                    try {
                        return field.get(instance);
                    } catch (IllegalAccessException e) {
                        throw new RuntimeException(e);
                    }
                }));
        String[] paths = path.split("\\.");
        String nextPath = String.join(".", Arrays.asList(paths).subList(1, paths.length));
        Object nextInstance = fieldToValue.get(paths[0]);
        return testJavaPath(nextPath, nextInstance);
    }

    public static void main(String[] args) {

        User user = new User(1, "Bob",

            new Address(
                new Country(
                    "France",
                    250,
                    "FR",
                    "FRA"
                ),
                "Paris",
                new Street(
                    "Assas",
                    21
                )
            ));

        System.out.println(testJavaPath("name", user));
        System.out.println(testJavaPath("address", user));
        System.out.println(testJavaPath("address.country", user));
        System.out.println(testJavaPath("address.country.name", user));
        System.out.println(testJavaPath("address.country2.name", user));

    }

    public record User(int id, String name, Address address) {
    }

    public record Address(Country country, String city, Street street) {
    }

    public record Street(String name, int number) {
    }

    public record Country(String name, int iso3166Numeric, String iso3166alpha2, String iso3166Alpha3) {
    }
}
```

> It's not the first time I see there's inconvenient to do mob programming for remote people. Some shortcut doesn't work when connecting via Citrix. There's non-negligible latency when remote people control coding via Teams. To search for what can be done to improve the remote user experience.

## Next Step Refactoring

Coach_A raises a question "**What do you think about this code?**"

I feel there's something not clear in the code. Firstly, I don't like recursive code because it's not intuitive and error-prone on the return condition. Secondly, parsing a path should be separate from getting the value of an object because later we may change the JavaPath syntax. But I'm not sure where to start the refactoring.

Coach_A gives a hint, what if we change the syntax to use "_" rather than ".", how do you change your code? From my point of view, the testJavaPath only needs to know what's the current path to query the value and what's the next path to recursive call the method. It doesn't care about how to get this information. So we can create a Path class to do that.

Coach_A proposes that Colleague_C takes control of coding and I navigate. I start to explain what I want but it's not clear for Colleague_C. And it only remains a dozen minutes. Then Colleague_B takes over as the navigator. After refactoring, our solution looks like that:

```java
public class Main {

    public static Object testJavaPath(Path path, Object instance) {
        if (path.isEmptyPath() || instance == null) {
            return instance;
        }
        Map<String, Object> fieldToValue = Arrays.stream(instance.getClass().getDeclaredFields())
            .collect(Collectors.toMap(
                Field::getName,
                field -> {
                    try {
                        return field.get(instance);
                    } catch (IllegalAccessException e) {
                        throw new RuntimeException(e);
                    }
                }));
        Object nextInstance = fieldToValue.get(path.getFirstPath());
        return testJavaPath(path.getNextPath(), nextInstance);
    }
    
    public static void main(String[] args) {
        User user = new User(1, "Bob",
            new Address(
                new Country(
                    "France",
                    250,
                    "FR",
                    "FRA"
                ),
                "Paris",
                new Street(
                    "Assas",
                    21
                )
            ));
        System.out.println(testJavaPath(new Path("name", "."), user));
        System.out.println(testJavaPath(new Path("address", "."), user));
        System.out.println(testJavaPath(new Path("address.country", "."), user));
        System.out.println(testJavaPath(new Path("address.country.name", "."), user));
        System.out.println(testJavaPath(new Path("address.country2.name", "."), user));

    }

    public record Path(String rawPath, String delimiter) {
        public String getFirstPath() {
            String[] paths = rawPath.split("\\" + delimiter);
            return paths[0];
        }

        public Path getNextPath() {

            String[] paths = rawPath.split("\\" + delimiter);
            String nextPath = String.join(delimiter, Arrays.asList(paths).subList(1, paths.length));
            return new Path(nextPath, delimiter);
        }

        public boolean isEmptyPath() {
            return rawPath == null || rawPath.isBlank();
        }

    }

    public record User(int id, String name, Address address) {
    }

    public record Address(Country country, String city, Street street) {
    }

    public record Street(String name, int number) {
    }

    public record Country(String name, int iso3166Numeric, String iso3166alpha2, String iso3166Alpha3) {
    }

}
```

> "Think about audient" is always appreciated. As Colleague_C just graduated and joined our team, I should explain the jargon when I need to use them.

## Ending

Time passes quickly and we are at the end of this coding yoga. **"What do you think about the code now?"** Coach_A asks again this question. At the moment when I need to change the test code because of the API's change, I see that the Path API is not well defined. Because I need to pass the delimiter every time which is annoying. And the code still uses a recursive call. We don't have time to do more change.

Then Coach_A quickly shows us an iteration solution. It starts from going through the paths. For each path, we evaluate and update the instance.

```java
public class Main {
    public static Object testJavaPath(String path, Object instance) {
        Object currentInstance = instance;
        String[] fields = path.split("\\.");
        for(String field : fields) {
            try {
                currentInstance = currentInstance.getClass().getDeclaredField(field).get(currentInstance);
            } catch (IllegalAccessException | NoSuchFieldException e) {
                return null;
            }
        }
        return currentInstance;
    }
}
```

Based on that, Coach_A shows one further refactoring. When iterating the paths, we can just create the function to evaluate the instance without applying it. Like that, we can composite the function and only apply it at the end when we need the result. What we do finally is to compile the path to create an executable function.

```java
public class Main {
    public static Object testJavaPath(String path, Object instance) {
        Function<Object, Object> query = compile(path);
        return query.apply(instance);
    }

    private static Function<Object, Object> compile(String path) {
        return Arrays.stream(path.split("\\."))
            .map(Main::valueGetter)
            .reduce(Function.identity(), Function::andThen);
    }

    public static Function<Object, Object> valueGetter(String attribute) {
        return instance -> {
            try {
                return instance.getClass()
                    .getDeclaredField(attribute)
                    .get(instance);
            } catch (IllegalAccessException | NoSuchFieldException e) {
                throw new RuntimeException(e);
            }
        };
    }
}
```

## Review

After the coding yoga, I review the first complete solution we put in place. When I recheck each step, I find that I can't give a semantic to the map. A map can be used for caching, for mapping, or as a container to transport data from where it is created to where it needs to be used. Here we create the map just to get one value from it, so why not get the value directly? From this, we may easily see how to go from recursion to iteration. BTW, there's always a way to [replace recursion with iteration](https://www.refactoring.com/catalog/replaceRecursionWithIteration.html).

```java
public class Main {

    public static Object testJavaPath(String path, Object instance) {
        if (path == null || path.isEmpty() || instance == null) {
            return instance;
        }
        String[] paths = path.split("\\.");
        Object nextInstance = null;
        try {
            nextInstance = instance.getClass().getDeclaredField(paths[0]).get(instance);
        } catch (IllegalAccessException | NoSuchFieldException e) {
            throw new RuntimeException(e);
        }
        String nextPath = String.join(".", Arrays.asList(paths).subList(1, paths.length));
        return testJavaPath(nextPath, nextInstance);
    }
}

```

We can have lots of different directions to do refactoring. Some of them are crucial because we can do further refactoring based on them while others are small enhancements. Some have direct benefits while others only show benefits much later when we start to add new features.

Congratulations to the most courageous who read everything! I hope you like this article 😊