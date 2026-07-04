---
title: Dependency Injection is About Seams
pubDate: 2026-07-03
---

**Dependency injection** is when an object receives its required dependencies from an external source rather than creating them itself. That's it. That's the whole idea. 

When discussing dependency injection, many online and in the workplace get entirely too bogged down with concepts like containers, decorators, providers, service registries, cradles, modules, and framework-specific trivialities. All of these tools can be useful! But they aren't the main idea. 

When you distill dependency injection down to its essence and realize it's the measured practice of:
- making your dependencies explicit
- isolating external systems behind narrow contracts
- providing implementations that can be swapped depending on the environment
it becomes much clearer how you can apply this concept and begin writing better, more robust code.

**A codebase does not become better because every class has an interface or because construction has been hidden inside a framework. It becomes better when important boundaries are explicit and controlled.**

## Dependency Injection is About Seams

Dependency injection is not a framework pattern. The core idea is not "use a DI library." The core idea is that application code should receive its dependencies from outside instead of constructing them internally.

**This creates a seam.**

**A seam is anywhere one implementation can be replaced with another without changing the code that depends on it.** In practice, that means a service can use one implementation in production, another in tests, and another during local development. 

Containers and libraries are optional in DI, a seam is not.

Many teams reject DI after only seeing the heaviest possible version. Magical frameworks and decorators with hidden object graphs and indirect debugging. Thankfully, none of that is essential. Plain constructors, functions, and modules are enough to get most of the value.

## A Practical Example

Let's look at an example of some code that publishes a text document to S3.

```ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

async function publishReport(userId: string, body: string): Promise<string> {
  const s3 = new S3Client({});
  const bucket = process.env.REPORT_BUCKET!;

  const key = `reports/${userId}.txt`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    })
  );

  return key;
}
```

Here's what our tests might look like for this implementation:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { publishReport } from "./publishReport";

vi.mock("@aws-sdk/client-s3", () => {
  const send = vi.fn();

  return {
    S3Client: vi.fn(() => ({ send })),
    PutObjectCommand: vi.fn((input) => ({ input })),
  };
});

describe("publishReport", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      REPORT_BUCKET: "test-bucket",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("uploads the report to S3", async () => {
    const key = await publishReport("user-123", "hello");

    expect(key).toBe("reports/user-123.txt");

    expect(S3Client).toHaveBeenCalledWith({});

    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: "test-bucket",
      Key: "reports/user-123.txt",
      Body: "hello",
    });

    const s3Instance = vi.mocked(S3Client).mock.results[0].value;
    expect(s3Instance.send).toHaveBeenCalledWith({
      input: {
        Bucket: "test-bucket",
        Key: "reports/user-123.txt",
        Body: "hello",
      },
    });
  });
});
```

This is a lot of test code for a function whose behavior is conceptually simple! 

This example is perfectly functional, but raises some questions. 
1) How can we test that this does what we expect?
	1) Right now, our tests are basically "did we call the S3 client." That's pretty brittle and resists refactoring.
2) If I'm developing on my local machine, do I need S3 credentials, or a mock s3 store?
3) What if something changes later, and we need to upload to a blobstore that isn't S3?
	1) Admittedly, this is a pretty trivial change with this version, I will leave a non-trivial example to the reader. I'm sure you've seen them.

All of those questions are difficult to answer cleanly because we have no seam. Where might we be able to create them?

If you recall from above:

> **Dependency injection** is when an object receives its required dependencies from an external source rather than creating them itself. 

The clear dependency is the S3 client. 

A first attempt might be to pass that client in instead of constructing it inside the function:

```ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

async function publishReport(
  s3: S3Client,
  userId: string,
  body: string
): Promise<string> {
  const bucket = process.env.REPORT_BUCKET!;
  const key = `reports/${userId}.txt`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    })
  );

  return key;
}
```

This is already an improvement. The function no longer decides how to construct an S3 client. That decision has moved outward. However, this only gets us part of the way there. 

This function still knows way too much:
- reports are stored in S3
- S3 uses buckets
- uploads happen through `PutObjectCommand`
- configuration comes from `process.env.REPORT_BUCKET`

So we have created a seam around client construction, but not around blob storage as a concept.

We can test this version, but the test is awkward because it has to impersonate the AWS SDK:

```ts
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

it("publishes a report to S3", async () => {
  process.env.REPORT_BUCKET = "test-bucket";
  const s3 = { send: vi.fn().mockResolvedValue({}) } as unknown as S3Client;
  const key = await publishReport(s3, "user-123", "hello");
  expect(key).toBe("reports/user-123.txt");
  expect(s3.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
});

```

This test gives us some coverage, but it is not especially satisfying. It mostly proves that we called the AWS SDK in roughly the way we expected. If we want to inspect the command input, the test becomes even more coupled to the SDK’s object shape.

```ts
it("publishes a report to the configured bucket", async () => {
  process.env.REPORT_BUCKET = "test-bucket";

  const send = vi.fn().mockResolvedValue({});
  const s3 = { send } as unknown as S3Client;

  await publishReport(s3, "user-123", "hello");

  const command = send.mock.calls[0][0] as PutObjectCommand;

  expect(command.input).toEqual({
    Bucket: "test-bucket",
    Key: "reports/user-123.txt",
    Body: "hello",
  });
});
```

This is not terrible, but it is a clue. The test is now coupled to `PutObjectCommand`. That may be acceptable in an adapter test, but it is not ideal for testing application behavior.

The application behavior we actually care about is simpler:

> When publishing a report, store the report body at the correct report key.

That statement doesn't mention S3, it doesn't mention buckets, it doesn't mention `PutObjectCommand`.

I would argue the real dependency is not `S3Client`. 

The real dependency is something capable of storing a blob.

What does our `BlobStore` need to do? Right now, just `put`. We send something off to a blob store, and there are no additional operations required. We should define an interface that does just that.

```ts
interface BlobStore {
  put(key: string, body: string): Promise<void>;
}
```

Notice what happened here: the S3 code did not disappear. It moved.

We still need a production implementation of `BlobStore`, and that implementation can know about S3:

```ts
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

class S3BlobStore implements BlobStore {
  constructor(
    private readonly s3: S3Client,
    private readonly bucket: string
  ) {}

  async put(key: string, body: string): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
      })
    );
  }
}
```

This is a good place for AWS-specific knowledge. The adapter knows that S3 has buckets. It knows that uploads use `PutObjectCommand`. It knows how to translate our application’s simple `put(key, body)` operation into the shape expected by the AWS SDK.

That is the boundary we wanted. The application code depends on the capability it needs. The adapter depends on the external system it integrates with.

Obviously, we must test this:

```ts
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";

describe("S3BlobStore", () => {
  it("uploads blobs to the configured bucket", async () => {
    const send = vi.fn().mockResolvedValue({});
    const s3 = { send } as unknown as S3Client;

    const blobStore = new S3BlobStore(s3, "test-bucket");

    await blobStore.put("reports/user-123.txt", "hello");

    expect(send).toHaveBeenCalledWith(expect.any(PutObjectCommand));

    const command = send.mock.calls[0][0] as PutObjectCommand;

    expect(command.input).toEqual({
      Bucket: "test-bucket",
      Key: "reports/user-123.txt",
      Body: "hello",
    });
  });
});
```

This test is coupled to `PutObjectCommand`, but that coupling is now in the right place. `S3BlobStore` is the adapter whose job is to translate our `BlobStore` contract into AWS SDK calls. `ReportPublisher` tests should not know about that translation. **The ugly mocky SDK test did not disappear; it got quarantined at the adapter boundary, exactly where it belongs.**

With that adapter isolated, the report publishing code can depend on `BlobStore` instead:

```ts
async function publishReport(
  blobStore: BlobStore,
  userId: string,
  body: string
): Promise<string> {
  const key = `reports/${userId}.txt`;
  await blobStore.put(key, body);
  return key;
}
```

This is much better! Look at all that we have eliminated. **Now all the `publishReport` function has to do is make a key, call the `put` method, and return the key.** The report publishing logic no longer needs to know about S3 client construction, buckets, or AWS SDK commands.

Now for testing, we can define an `InMemoryBlobStore`, based on our interface, that does not need access to S3 at all.

```ts
class InMemoryBlobStore implements BlobStore {
  private readonly objects = new Map<string, string>();
  async put(key: string, body: string): Promise<void> {
    this.objects.set(key, body);
  }
  get(key: string): string | undefined {
    return this.objects.get(key);
  }
  clear(): void {
    this.objects.clear();
  }
}

```

**This is completely reusable, any test that needs a `BlobStore` can use the same fake without mocking the AWS SDK!**

This fake is also worth testing directly:

```ts
describe("InMemoryBlobStore", () => {
  it("stores blobs by key", async () => {
    const blobStore = new InMemoryBlobStore();

    await blobStore.put("reports/user-123.txt", "hello");

    expect(blobStore.get("reports/user-123.txt")).toBe("hello");
  });

  it("overwrites blobs with the same key", async () => {
    const blobStore = new InMemoryBlobStore();

    await blobStore.put("reports/user-123.txt", "first");
    await blobStore.put("reports/user-123.txt", "second");

    expect(blobStore.get("reports/user-123.txt")).toBe("second");
  });
});
```

That may seem small, but it matters. A fake used across many tests becomes part of your test infrastructure. If it has behavior, that behavior should be deliberate.

```ts
it("publishes a report", async () => {
  const blobStore = new InMemoryBlobStore();
  const key = await publishReport(blobStore, "user-123", "hello");
  expect(key).toBe("reports/user-123.txt");
  expect(blobStore.get(key)).toBe("hello");
});
```

Our function `publishReport` is looking pretty good at this point, so **why might we still introduce a class?**

```ts
class ReportPublisher {
  constructor(private readonly blobStore: BlobStore) {}

  async publish(userId: string, body: string): Promise<string> {
    const key = `reports/${userId}.txt`;
    await this.blobStore.put(key, body);
    return key;
  }
}
```

The class does not make this “more dependency-injected” (lol). The dependency injection already happened in the function version. The class simply changes the shape of the code.

Instead of passing `blobStore` to every call, we pass it once when constructing the publisher. That can be useful when `publish` is part of a larger application service that will be called repeatedly.

For example, this is noisy:

```ts
await publishReport(blobStore, "user-123", "first report");
await publishReport(blobStore, "user-456", "second report");
await publishReport(blobStore, "user-789", "third report");
```

**The dependency is not really part of each operation. It is part of the publisher’s environment.**

The class makes that relationship explicit:

```ts
const publisher = new ReportPublisher(blobStore);

await publisher.publish("user-123", "first report");
await publisher.publish("user-456", "second report");
await publisher.publish("user-789", "third report");
```

This distinction is small in this example, but it becomes more useful as the service grows. A real `ReportPublisher` might need a blob store, a clock, a logger, a metrics recorder, and a report key policy. **Passing all of those through every function call would make the operational inputs hard to distinguish from the stable dependencies.**

```ts
class ReportPublisher {
  constructor(
    private readonly blobStore: BlobStore,
    private readonly clock: Clock,
    private readonly logger: Logger
  ) {}
  async publish(userId: string, body: string): Promise<string> {
    const key = `reports/${userId}/${this.clock.now().toISOString()}.txt`;
    this.logger.info("Publishing report", { userId, key });
    await this.blobStore.put(key, body);
    return key;
  }
}
```

At this point, the class is doing something useful. **It gathers the stable dependencies once, gives the operation a clear name, and separates construction-time concerns from call-time inputs.**

The important distinction is this:

- `blobStore`, `clock`, and `logger` are dependencies.
- `userId` and `body` are inputs to the operation.

A class gives us a convenient place to hold the former while keeping the method signature focused on the latter.

That said, the function version is not wrong. If a dependency is only used by one small function, passing it directly as an argument can be the simplest design. **A class becomes useful when several operations share the same dependencies, when the service has a coherent domain role, or when construction needs to happen once at the edge of the application.**

## Inject the Boundary You Actually Care About

The lesson here is not that every function needs an interface, every class needs a constructor, or every codebase needs a dependency injection container. The lesson is that dependencies should be explicit at the boundaries where substitution matters.

Sometimes that boundary really is a concrete client. If you are writing a thin S3 adapter, depending on `S3Client` is fine. The adapter’s job is to know about S3. Its tests may reasonably assert that `PutObjectCommand` is constructed correctly, because that is the behavior of the adapter.

But application code usually wants a different boundary. It does not care that reports are stored in S3. It cares that reports are stored somewhere. That is why `BlobStore` is a better dependency for `ReportPublisher` than `S3Client`.

This is the practical test I use:

> If the thing changes, should this code have to change?

If switching from S3 to another blob store should not affect report publishing logic, then report publishing should not depend directly on S3. If changing how S3 commands are constructed should affect only the S3 adapter, then that knowledge belongs in the adapter and nowhere else.

That is the real value of dependency injection. It lets the code say what it needs without saying too much about how that need is satisfied.

Done well, DI gives you a few concrete benefits:

- tests that assert behavior instead of SDK call choreography
- local development that can use in-memory or filesystem implementations
- production wiring that stays at the edge of the application
- application services that are organized around domain concepts instead of vendor APIs

Done poorly, DI becomes ceremony. You get interfaces for everything, containers hiding construction, and tests that still mock implementation details because the **wrong boundary** was abstracted.

The goal is not abstraction for its own sake. The goal is **controlled coupling**.

A good dependency is boring. It has a small contract. It describes what the application needs. It hides details that the application should not know. It can be replaced in tests, local development, or production without rewriting the code that depends on it.

That is dependency injection in its useful form: **explicit dependencies, narrow contracts, and construction pushed outward** to the place where environment-specific decisions belong.