---
title: You're Thinking About AuthZ Wrong
description: Why growing authorization systems need relationships and policy decisions beyond scattered role checks and ownership conditionals.
pubDate: 2026-07-05
---

A key part of developing a multiuser app is deciding how you will represent "who can access what." 

Normally this begins in a pretty naive fashion, divide up your classes of users (who is accessing) and your classes of objects (what is being accessed). Write something to the database to denote which class a user or object belongs to. Sprinkle in conditionals at object access time. 

E.g: 

```python
def can_user_view_document(user: User, doc: Document) -> bool:
	if user.is_admin:
		return True
	if doc.owner == user:
		return True
	return False
```

Above we have two classes of users. You're an admin or non-admin, and you're a document owner or not. 

Over time a PM will assign you a ticket with something like "Users want to share documents with each other." or "Engineers need to be able to see all documents in a given folder, if the folder was shared with engineers, except Steve because he's weird and will bikeshed this to death."

So you'll hack together something like this to get the work done within a sprint, and get the PM off your back.

```python
def can_user_view_document(user: User, doc: Document) -> bool:
	if user.is_admin:
		return True
	if doc.owner == user:
		return True
	# keep steve out
	if user in doc.prohibited_users:
		return False
	# shared_with is a list of users the document is shared with
	if user in doc.shared_with:
		return True
	# doc.folders is a list of folders the document appears in
	for folder in doc.folders
		# you can see everything in folders you own
		if folder.owner == user:
			return True
		# keep steve out at the folder level.
		# shared_with here is also a list of users, generated from user groups
		# elsewhere in the codebase
		if (user in folder.shared_with) and (user not in doc.prohibited_users):
			return True
	return False
```

What a mess!

There may be better ways to implement this particular mess, but this class of implementation will always tend toward messiness because it frames the problem incorrectly.

The code above assumes that authorization questions are a pile of object-local boolean checks. Does this user have this flag? Is this user listed on this object? Is this object inside another object whose owner matches the user? Is Steve specifically forbidden from seeing this because Steve has never once let a product decision survive contact with Slack?

That model works but does not scale.

In reality, humans naturally model authorization as **relationships**.

For example:

> Engineers need to be able to see all documents in a given folder, if the folder was shared with engineers, except Steve because he's weird and will bikeshed this to death.

This sounds like a product request. It is actually a graph.

There are users. There are groups. There are folders. There are documents. Users belong to groups. Documents belong to folders. Folders can be shared with groups. Users can be blocked from particular documents. Somewhere inside this sentence is not a boolean check, but a small access graph waiting to be admitted into polite society.

You can draw it like this:

```
user:alice ── member ──▶ group:engineering
user:steve ── member ──▶ group:engineering

folder:roadmap ── viewer ──▶ group:engineering

document:q3-plan ── parent ──▶ folder:roadmap
document:q3-plan ── blocked ──▶ user:steve
```

Now the question "can Alice view `q3-plan`?" becomes something more precise:

```
Can user:alice reach document:q3-plan#viewer?
```

And the question "can Steve view `q3-plan`?" becomes:

```
Can user:steve reach document:q3-plan#viewer,
minus anyone in document:q3-plan#blocked?
```

That is a different shape of problem.

The naive implementation asks:

```
What if user is admin?
What if user owns the document?
What if user is directly shared?
What if user is in a folder?
What if user is in a group?
What if user is blocked?
What if the folder is blocked?
What if the org is blocked?
What if the moon is in retrograde?
```

The graph implementation asks:

```
What relationships exist?
How do relationships compose?
What set of users does this relation resolve to?
Is this user in that set?
```

That sounds more abstract, but it is actually closer to how people talk.

Nobody says, "Please add a branch to the authorization conditional where the current principal has a foreign key match against the owner column, unless the denied users join table contains the principal id."

People say, "Everyone in engineering can see this folder except Steve."

That sentence is graph-shaped!

Zanzibar-style authorization models access as relationships between objects:

```
group:engineering#member@user:alice
group:engineering#member@user:steve
folder:roadmap#viewer@group:engineering#member
document:q3-plan#parent@folder:roadmap
document:q3-plan#blocked@user:steve
```

Then instead of asking your application code to rediscover the whole organizational chart every time someone opens a document, you ask a smaller and better question:

```
Does user:alice have viewer on document:q3-plan?
```

The authorization system answers that by walking the relationship graph and applying the rewrite (relational) rules you defined.

For example:

```
document.viewer =
    owner
  + direct_viewer
  + parent->viewer
  - blocked
```

That is the whole move, and it scales!

Once you model authorization this way, you stop translating normal product language into increasingly complex conditionals. The statement “everyone in this group can see everything in that folder except Steve” can stay recognizably itself all the way down into the authorization layer.

That is a good sign. The model matches the way people already talk and think about authorization.

---

Links:

- [The Zanzibar Whitepaper, Annotated by Authzed](https://authzed.com/zanzibar)
- [My toy zanzibar implementation in python](https://github.com/tylerchambers/zanzipy)
