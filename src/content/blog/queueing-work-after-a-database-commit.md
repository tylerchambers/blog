---
title: Queueing Work After a Database Commit
description: An outbox provides durable eventual dispatch; an after-commit callback provides cleaner code with a deliberate failure window.
pubDate: 2026-07-26
---

A common backend operation looks simple:

1. Write some state to the database.
2. Commit the transaction.
3. Queue asynchronous work that depends on that state.

For example, create an order and then enqueue a BullMQ job to fulfill it.

The annoying part is that the database and Redis do not share a transaction. We cannot atomically commit the database write and enqueue the job.

If we enqueue before committing, a worker might run against data that later rolls back. If we enqueue afterward, the process might die after the commit but before the job reaches BullMQ.

There are two common ways to handle this.

## Option A: Transactional Outbox

Instead of adding the BullMQ job directly, write an outbox record inside the database transaction:

```ts
await db.transaction(async (tx) => {
  const order = await createOrder(tx, input);

  await tx.insert(outbox).values({
    type: "fulfill-order",
    payload: { orderId: order.id },
  });
});
```

A separate dispatcher claims pending outbox rows and publishes them to BullMQ:

```ts
for (const event of await claimOutboxEvents()) {
  await queue.add(event.type, event.payload, {
    jobId: event.id,
  });

  await markPublished(event.id);
}
```

The order and the intent to process it commit together. If the request process disappears immediately afterward, the outbox row is still there and can be retried.

This is the stronger durability story.

I also find it aesthetically troublesome.

We already have a queue, but now we have a database table acting as a queue in front of the queue. We need another process to poll it, claim rows, retry failures, retain or delete old records, and monitor anything that gets stuck.

It is especially awkward when the outbox record is not a meaningful domain event. Sometimes it is just a serialized BullMQ call with extra steps.

The outbox also does not magically give us exactly-once execution. The dispatcher can successfully enqueue the job and then crash before marking the row as published. Stable job IDs and idempotent workers still matter.

## Option B: Defer Until After Commit

The simpler approach is to register the enqueue operation during the transaction and run it only after the commit succeeds:

```ts
await unitOfWork.run(async ({ db, afterCommit }) => {
  const order = await createOrder(db, input);

  afterCommit(() =>
    queue.add("fulfill-order", {
      orderId: order.id,
    }),
  );
});
```

This is much nicer to read.

The business operation and its follow-up work remain together. A rolled-back transaction does not produce a job, and there is no outbox table or dispatcher process.

The limitation is that "after commit" is an ordering guarantee, not a durability guarantee.

The database may commit successfully, and then the process may crash before the callback runs. The order exists, but the job never does.

That can be perfectly reasonable when the job is best-effort, recoverable, or backed by reconciliation. It is weaker when the job is the only mechanism that will ever advance the committed state.

## The Tradeoff

The outbox says:

> Once the database commits, the intent to perform the work is durable.

The after-commit callback says:

> Do not attempt the work unless the database commits.

Those are not the same guarantee.

The outbox gives us a stronger recovery model, but introduces another durable representation of the work and the machinery required to move it into BullMQ.

The after-commit approach keeps the code direct and operationally simple, but leaves a failure window between the database commit and the queue write.

So the decision is not really, "Which pattern is correct?"

It is whether this particular operation requires durable eventual dispatch badly enough to justify an outbox, or whether an after-commit enqueue plus a weaker recovery story is sufficient.

Option A gives stronger guarantees and more machinery.

Option B gives cleaner code and a hole we need to consciously accept.
