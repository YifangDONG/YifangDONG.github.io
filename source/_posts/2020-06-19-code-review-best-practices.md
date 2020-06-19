---
title: Code review best practices
date: 2020-06-19
tags: 
	- English writing	
	- 最佳实践
---

As a developer, code review is one of my daily tasks. I would like to make it valuable and engaging. Thinking about the following questions allows me to know how to build an efficient code review process. This blog is inspired by [five code review antipatterns](https://blogs.oracle.com/javamagazine/five-code-review-antipatterns)

### Why is the team doing reviews?

There are several reasons we do the code review. The most common one is to ensure the code readability and verify the implementation matches the requirement. That's also the simplest type of reviews for both reviewers and developers as our team agrees on what clean code looks like. The second reason is to review the design. Design reviews always take time as we always have lively debates, so when a developer thinks he needs a design review, he should ask for the code review as early as possible. Last but not least, the code review also serves to share knowledge. When developers have free time, they can review their coworkers' code and thus keep up with what they have done so far.

### What are team members looking for?

The purpose of code review is to ensure code readability. We are looking to see if naming is ambiguous, if the method is decomposed illogically, or if the code is prone to errors.  We always use *Effective Java* as a reference for the review. For the design review, there's no one standard to follow, because the code design is usually a question of how to make trade-offs. There's no one perfect design. We can only make a good enough design. 

### Who is involved?

Everyone should review the code, no matter if he is junior or senior. The code can also be reviewed by several people. But we need one assigned reviewer who is responsible for saying when the code is good enough to submit. This ensures that every code review has an owner to push to completion. When reviewers and developers have different opinions, an expert can be involved to make a final decision. 

### When does the team do reviews?

Usually, reviews are required when the developer finishes his coding. It's a waste of time for a reviewer to review unfinished work. However, when many modules need to be modified, the developer should do a progressive review. Once part of the development is finished, he can ask for a review. As mentioned before, the design review should be initiated as early as possible to avoid having to redo the entire development. As for the knowledge sharing review, it can happen anytime. For example, when I come back from vacation or switch to another project, I can review the submitted code to catch up on the evolution of the project.

### Where does the team do reviews?

We use Swarm as a review tool. It provides some functions such as comparing the difference between two versions and notifying the developer once a comment is added or the review status is changed. We can also configure the rules such as the code with at least one vote-up can merge to the main branch. Comparing with Git Pull-Request, Swarm doesn't integrate well with the Jenkins pipeline.

Swarm is used for reviewers to add comments. Some might be a task to fix, others are open questions for better design or requests for information. When there are many small tasks added during the review, to avoid excessive back and forth, the developer and reviewer will work through the source code together.
