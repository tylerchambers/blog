---
title: Stop Modeling State Machines With Booleans
description: Use booleans for independent binary facts and unions for mutually exclusive states, keeping state-specific data with the state that owns it.
pubDate: 2026-08-18
---

A piece of TypeScript advice appears often enough to have become a slogan:

> Make illegal states unrepresentable.

A nearby version is:

> Don't use booleans. Use enums.

Both are directionally useful, but neither tells you very much about what to do on Monday morning.

Booleans are not intrinsically bad. Most codebases contain thousands of perfectly reasonable ones:

```ts
type User = {
  isAdmin: boolean
  hasAcceptedTerms: boolean
}
```

Those are independent binary facts. A user can be an administrator or not. They can have accepted the terms or not. All four combinations are meaningful.

The interesting case is when several booleans are not independent facts at all. They are different answers to the same question.

Consider:

```ts
type Job = {
  started: boolean
  completed: boolean
}
```

The intended states are presumably:

```text
started = false, completed = false  // pending
started = true,  completed = false  // running
started = true,  completed = true   // completed
```

But the type also permits:

```text
started = false, completed = true
```

What is that?

Probably nothing. It is an artifact of the representation.

We needed three states and represented them using two independent booleans. Two booleans produce four possible combinations, so we accidentally invented a fourth state.

The type should probably have been:

```ts
type JobStatus =
  | "pending"
  | "running"
  | "completed"

type Job = {
  status: JobStatus
}
```

This is the useful part of the advice about booleans: **if several values jointly describe one state machine, model the state machine.**

## Products Versus Sums

The mathematical intuition is simple.

Given:

```ts
type State = {
  foo: boolean
  bar: boolean
}
```

the possible values are the Cartesian product of the possibilities for `foo` and `bar`:

```text
2 × 2 = 4
```

Add a third boolean:

```text
2 × 2 × 2 = 8
```

A structure containing multiple independent fields is, roughly speaking, a product type.

A union behaves differently:

```ts
type State =
  | { kind: "foo" }
  | { kind: "bar" }
  | { kind: "baz" }
```

This says the value is one alternative *or* another *or* another.

Conceptually:

```text
1 + 1 + 1 = 3
```

This is a sum type.

So if the domain says:

```text
A or B or C
```

but the program says:

```ts
{
  isA: boolean
  isB: boolean
  isC: boolean
}
```

we have modeled a sum as a product.

The domain contains three meaningful states. The type contains eight.

That mismatch is where the bugs come from.

## The Enum Advice Is Mostly About Cardinality

This also explains the common advice to replace booleans with enums.

Suppose a dialog can operate in three modes:

```ts
type DialogProps = {
  isCreating: boolean
  isEditing: boolean
  isViewing: boolean
}
```

The caller can now provide:

```ts
{
  isCreating: true,
  isEditing: true,
  isViewing: true,
}
```

Perhaps there is some convention about which flag wins. Perhaps the component asserts that only one can be true. Perhaps everyone simply knows not to do this.

None of those facts are present in the type.

The obvious replacement is:

```ts
type DialogMode =
  | "create"
  | "edit"
  | "view"

type DialogProps = {
  mode: DialogMode
}
```

I would usually use a string union here rather than TypeScript's `enum` keyword, but that distinction is beside the point.

The important transformation is not:

```text
boolean → enum
```

It is:

```text
three independent binary values → one value with three alternatives
```

The representation now has the same number of meaningful states as the domain.

## Discriminated Unions Become Useful When States Carry Data

Replacing several booleans with one string is useful, but discriminated unions become much more compelling when different states require different information.

Consider a payment result:

```ts
type PaymentResult = {
  success: boolean
  paymentId?: string
  error?: string
}
```

There are obvious implicit rules here.

If `success` is true, `paymentId` should exist and `error` should not.

If `success` is false, `error` should exist and `paymentId` should not.

But none of those rules are actually encoded:

```ts
const result: PaymentResult = {
  success: true,
  error: "Card declined",
}
```

This is legal TypeScript.

A discriminated union makes the dependency explicit:

```ts
type PaymentResult =
  | {
      success: true
      paymentId: string
    }
  | {
      success: false
      error: string
    }
```

Now the state and the data belonging to that state cannot drift apart.

Notice that the discriminator is itself still a boolean.

```ts
if (result.success) {
  console.log(result.paymentId)
} else {
  console.error(result.error)
}
```

So "don't use booleans" is clearly the wrong rule.

The problem was never the boolean. The problem was that several fields had validity conditions which depended on one another, but those conditions existed only in programmers' heads.

## State-Specific Data Should Live With the State

This pattern becomes especially useful in domain models.

Suppose an approval process is represented like this:

```ts
type Request = {
  isDraft: boolean
  isSubmitted: boolean
  isApproved: boolean
  isRejected: boolean

  submittedAt?: Date
  approvedAt?: Date
  approvedBy?: UserId
  rejectedAt?: Date
  rejectionReason?: string
}
```

This is an impressive number of opportunities to construct nonsense.

Can something be both approved and rejected?

Can `approvedAt` exist when `isApproved` is false?

Can an approved request lack an approver?

Can a draft request have a `submittedAt`?

The codebase will eventually acquire validation functions, assertions, comments, database constraints, and conditionals which collectively attempt to preserve the intended model.

Or the type can simply describe the model:

```ts
type Request =
  | {
      status: "draft"
    }
  | {
      status: "submitted"
      submittedAt: Date
    }
  | {
      status: "approved"
      submittedAt: Date
      approvedAt: Date
      approvedBy: UserId
    }
  | {
      status: "rejected"
      submittedAt: Date
      rejectedAt: Date
      reason: string
    }
```

Now an approved request necessarily has an approver.

A rejected request necessarily has a reason.

A draft request cannot accidentally contain approval metadata.

The compiler is enforcing rules that would otherwise be scattered throughout application code.

This is what "make illegal states unrepresentable" looks like in ordinary TypeScript. There is no dependent type theory involved. We simply noticed that the domain was a state machine and modeled it as one.

## Do Not Rebuild State Machines Libraries Already Own

There is one important limit to this advice.

One place application developers frequently encounter state machines is asynchronous data fetching. A simplified example might look like this:

```ts
type UserState =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; user: User }
```

This is a perfectly reasonable type if you own the asynchronous operation.

But in a React application using TanStack Query, writing it may be pointless.

TanStack Query already owns that state machine.

Code like:

```ts
const query = useQuery({
  queryKey: ["user", userId],
  queryFn: () => getUser(userId),
})

if (query.isPending) {
  return <Spinner />
}

if (query.isError) {
  return <ErrorMessage error={query.error} />
}

return <UserProfile user={query.data} />
```

is already consuming a state model provided by the library.

Wrapping that result in another homemade:

```ts
type UserState =
  | ...
```

usually adds ceremony rather than safety.

In fact, the library's actual state machine is richer than the toy `loading | error | success` model. A query can have successful cached data while a background fetch is in progress. "Do I have data?" and "am I currently fetching?" are related questions but not identical ones.

A naïve homemade model can easily erase those distinctions.

The lesson is therefore not that every interesting piece of state deserves a new discriminated union.

It is:

> Model the state machine at the layer that owns it.

If a library already provides a coherent state model, use it.

If your domain contains mutually exclusive states and you own the model, encode those states directly rather than reconstructing them from flags.

## A Useful Smell

I treat code like this as a smell:

```ts
if (foo && !bar) {
  // ...
} else if (!foo && bar) {
  // ...
} else if (foo && bar) {
  // ...
}
```

Not because boolean logic is inherently suspicious, but because it often indicates that `foo` and `bar` are not actually independent properties.

They are bits being used to encode a state machine.

Likewise, a type containing several fields named:

```text
isPending
isRunning
isComplete
isFailed
```

should provoke the question: can more than one of these legitimately be true at once?

If the answer is no, they probably want to be one field.

And if each state requires different data, they probably want to be a discriminated union.

## The Rule

The slogan I find more useful than "don't use booleans" is:

> **Use booleans for independent binary facts. Use unions when several values are competing descriptions of the same state. Put state-specific data inside the corresponding union member.**

That rule is narrow enough to be actionable.

It does not require turning an ordinary TypeScript codebase into a type-system experiment. It simply asks that the shape of the program resemble the shape of the domain.

When the domain contains three states, giving the program eight is rarely an improvement.
