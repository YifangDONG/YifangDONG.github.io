---
title: 重叠构造函数模式的替代模式
date: 2019-01-02
lang: zh-CN
tags:
	- 设计模式
	- 翻译
	- Java
---

原文链接：https://www.vojtechruzicka.com/avoid-telescoping-constructor-pattern/
重叠构造函数模式(Telecoping constructor pattern) 十分常见。然而，它有很多缺点。那么，我们应该使用什么替代方案呢？

## 重叠构造函数模式

Java语言不支持构造函数的默认参数。一个解决方法是“重叠构造函数”(Telecoping constructor)。如下例子所示：构造函数的调用呈现层次结构。一个只有必要参数的构造函数和若干有可选参数的构造函数。

```java
public class Person{

    private final String firstName; //required
    private final String lastName; //required
    private final String description; //optional
    private final String address; //optional

    public Person(String firstName, String lastName) { 
        this(firstName, lastName, "No description available"); //可选参数赋默认值
    }

    public Person(String firstName, String lastName, String description) {
        this(firstName, lastName, description, "No address available");
    }

    public Person(String firstName, String lastName, String description, String address) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.description = description;
        this.address = address;
    }
}
```

## 重叠构造函数模式的缺点

在上述例子中，只有Person类只有四个属性，看起来似乎没有什么问题。但当类的属性增加时，问题就来了。

1. 构造函数的可读性变差。由于有很多可选属性和很多构造函数，开发过程中就要读所有的构造函数，然后选择自己需要的。这无形中增加了使用的复杂度。
2. 开发者调用构造函数时很容易出错(error prone)，由于交换两个类型相同的变量并不会引发编译错误。例如对于第三个构造函数，交换description和address在逻辑上是错误的但编译器并不能提示程序员出错了。
3. 由于有很多可选的属性，而构造函数不可能是所有属性的排列组合（这样会导致构造函数的个数急剧增加），所以我们使用的时候必然会传入很多类似null，Collections.emptyList()等空集合等等。
4. 当我们增加属性时，我们需要增加新的构造函数并修改整个构造函数的链条。  

也就是说，这种模式的可扩展性差，难以维护。

## 替代方案：JavaBeans

最简单方便和灵活的替代方案是使用JavaBeans。简单来说，JavaBeans 是一类符合下列规范的Java类：

1. JavaBean 必须是一个public的类
2. JavaBean 必须有一个空的构造函数
3. JavaBean 的属性/变量都是private的
4. 属性应该通过一组 getXxx 和 setXxx 方法来访问。

例如，之前的例子变成：

```java
public class Person{

    //属性不能被设置为final，无法区分属性是必须的或可选的
    private String firstName; 
    private String lastName; 
    private String description; 

    public Person() {
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getDescription() {
        return description;
    }
}

//使用
Person toto = new Person();
toto.setFirstName("toto");
toto.setLastName("titi");
toto.setDescription("I'am a simple person")
```



优点是显而易见的：

- 简单，容易修改。
- 可读性强，例如不会不小心错误地将description赋值给lastName。
- 容易扩展，增加类的属性。

然而缺点也是非常严重的:  JavaBeans是可变的(Mutable)，也就是说即使在构造完成后，Person的实例可以随时使用setter修改。对象的构造不再是原子操作，我们可以在对象没有构造完全的状态下访问对象。同时当我们访问对象时不知道它的状态，也不能确定是否在创建对象和访问对象的过程之间有其他进程修改了该对象。也就是说JavaBeans丧失了所有不可变对象(Immutable)的优点，特别是线程安全。

## 替代方案2： 静态工厂方法 (Static Factory Method)

重叠构造函数模式的缺点之一是可读性差。由于构造函数都具有相同的名称，因此很难区分彼此。静态工厂方法便是用来解决这个问题的。

```java
public class Person {
        
    public static Person createNamedPerson(String firstName, String lastName) {
    	return new Person(firstName, lastName);
	}
    
    public static Person createAnonymousPerson() {
        return new Person("Anonymous", "Anonymous");
    }
    
    private Person(String firstName, String lastName) {
    	this.firstName = firstName;
    	this.lastName = lastName;
	}
    
}
```

正如上面的例子所示，静态方法的返回值是Person类的实例。与构造函数相比，这样做的好处有：

1. 每个方法都有一个不同的描述性的名字，揭示了该方法的意图

2. 返回值不需要每次都返回一个全新的实例，这样的实现常被用于实例缓存，池化等等。例如：

```java
   public class PersonProvider {
       private static Map<String,Person> cache = new HashMap<>();
       
       public static Person createPerson(String firstName, String lastName) {
           return cache.computeIfAbsent(
               firstName+lastName, 
               k -> new Person(firstName,lastName));
       }
   }
```

和JavaBeans不同的是静态工厂方法能返回不可变实例。然而，与构造函数一样，静态工厂方法的扩展性不好，尤其是当参数很多时，起一个恰当的函数名也是一个让人头疼的问题。

## 替代方案3：建造者 (Builder)

如果不变性是一个问题，那么建造者模式是一个很流行的方法用于构造具有许多参数的对象。这个方法是 [Joshua Bloch](https://twitter.com/joshbloch)在他的书[Effective Java](https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/)中提出的。（具体可见：*Chapter 2 - Creating and Destroying Objects - Item 2: Consider a builder when faced with many constructor parameters*）不要和 [Gang of Four](https://zh.wikipedia.org/wiki/设计模式：可复用面向对象软件的基础)的构造器模式（Builder pattern）搞混了，Gof的Builder解决的是将复杂对象的建造过程抽象出来（使用抽象类或接口进行抽象），使这个抽象过程的不同实现方法可以构造出拥有不同属性的对象。关于Gof的Builder的介绍可以看[这篇文章](https://design-patterns.readthedocs.io/zh_CN/latest/creational_patterns/builder.html)

### 使用过程

使用过程很像使用StringBuilder

1. 创建builder实例。可以在builder的创建时使用含参构造函数，参数是要创建的类的必要属性。
2. 逐个设置属性。通常，为了方便链式方法调用([fluent interface](http://martinfowler.com/bliki/FluentInterface.html))，构造器返回自己本身。
3. 调用build()方法获得构造好的实例。build()方法的底层实现（Under the hood）是调用需要构造的类的构造函数。因此这样做是一次构建，不可改变。

```java
PersonBuilder builder = new PersonBuilder();
Person bob = builder.firstName("Bob")
    				.lastName("Builder")
    				.description("create from Builder")
    				.address("1 road, builder city")
    				.build();
```

### 静态嵌套类Builder vs  分离Builder类

有两种基本的builder的实现方法：

- Builder作为单独的类

```java
public class PersonBuilder {
    private String firstName;
    private String lastName;
    private String description;
    private String address;

    public PersonBuilder() {
    }

    public PersonBuilder firstName(String firstName) {
        this.firstName = val;
        return this;
    }

    public PersonBuilder lastName(String lastName) {
        this.lastName = lastName;
        return this;
    }

    public PersonBuilder description(String description) {
        this.description = description;
        return this;
    }

    public PersonBuilder address(String address) {
        this.address = address;
        return this;
    }

    public Person build() {
        return new Person(firstName, lastName, description, address);
    }
}
```

Builder作为静态嵌套类（static nested  classes）。这里的静态意味着它可以在封闭类的实例上单独实例化。优点是它可以访问封闭类的私有成员。这意味着我们可以将构造函数声明为private从而强制使用Builder来实例化该类而禁止使用类的构造函数来实例化。

```java
  public class Person {
  
      private final String firstName;
      private final String lastName;
      private final String description;
  	private final String address;
      
      private Person(Builder builder) {
          firstName = builder.firstName;
          lastName = builder.lastName;
          description = builder.description;
          address = builder.address;
      }
  
      public static final class Builder {
          private String firstName;
          private String lastName;
          private String description;
          private String address;
  
          public Builder() {
          }
  
          public Builder firstName(String firstName) {
              this.firstName = firstName;
              return this;
          }
  
          public Builder lastName(String lastName) {
              this.lastName = lastName;
              return this;
          }
  
          public Builder description(String description) {
              this.description = description;
              return this;
          }
  
          public Builder age(String address) {
              this.address = address;
              return this;
          }
  
          public Person build() {
              return new Person(this);
          }
      }
  }
```

选择主要取决于个人偏好。很多人认为将Builder作为内部类很方便，将Builder和类捆绑在一起。私有构造函数也很常见。我个人通常会避免内部类，因此我喜欢将Builder和类分开（尽管在同一个包中）。根据单一责任原则，我认为这是两种不同的责任。我也很少禁止直接调用构造函数直接实例化类，除非有特殊的原因。如果有必要，我会使用protected（package private）限定构造函数，这样我仍可以在同一个包中使用分离的Builder并且防止从包的外部实例化该类。

### 自动生成Builder

IntelliJ 的重构方法可以帮助我们自动生成Builder。右键 -> refactor -> replace constructor with builder
![generate-builder](/images/generate-builder.PNG)

## 结论

Builder不是一个银弹，虽然它可以解决我们面对造函数有很多参数的问题。使用上述的哪种方法取决于具体情况。事实上，每种方法都有其优势和缺点。我们应该进一步思考的是：

1. 为什么这个类有这么多的属性？也许这是一个信号，警告我们这个类有太多的责任。它是否违背了单一责任原则（[the single responsibility principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html)）？我们是否应该提取其中的某些参数封装(encapsulate)在一个类中？
2. 或许类的属性足够少，可选属性的组合很少并且其余的都可以用已知的默认值代替，在这种情况下我们可以只用构造函数即可。
3. 也许不变性并不重要？也许这些类的属性会被频繁得改变，而每次创建新实例的开销很大？也许并不涉及并发？那么让我们坚持使用简单的JavaBeans，尽管这个模式被认为是过时的（old school style）。
4. 我们关心构造的实例是不可变的，线程安全的，那么让我们坚持使用Builder模式。
5. 构造过程复杂？对于不同的对象有像狗的构造过程？这时我们需要Gang of Four的Builder模式。

## 拓展

- [JavaBeans 规范](https://www.oracle.com/technetwork/java/javase/documentation/spec-136004.html)