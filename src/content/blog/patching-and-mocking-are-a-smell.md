---
title: Patching and Mocking Are a Smell
pubDate: 2026-07-19
---

Patching and mocking are useful tools. They are not always bad.

But when a test needs extensive patching or mocking, the design often has a problem.

The test is telling you that the code has no clear seam.

This post covers three common problems.

## 1. Patching Hides Dependencies

Consider this function:

```ts
import { readFile } from "node:fs/promises";

export async function loadConfig(): Promise<string> {
  return await readFile("./config.json", "utf8");
}
```

A test can patch `readFile`. But the function still hides its dependency.

The file system is not visible in the function signature. A reader cannot see that the function performs I/O.

A patch-based test can work, but it depends on module behavior and import details.

A clearer design makes the dependency explicit:

```ts
export interface FileReader {
  read(path: string): Promise<string>;
}

export async function loadConfig(files: FileReader): Promise<string> {
  return await files.read("./config.json");
}
```

The test is now simple:

```ts
import { expect, test } from "bun:test";
import { loadConfig } from "./config";

test("loads the config file", async () => {
  const files = {
    read: async (path: string) => {
      expect(path).toBe("./config.json");
      return '{"mode":"test"}';
    },
  };

  expect(await loadConfig(files)).toBe('{"mode":"test"}');
});
```

The dependency is visible. The test does not need a patch.

## 2. Mock-Heavy Tests Copy the Implementation

A mock often checks how the code works instead of what the code does.

Consider this test:

```ts
import { expect, mock, test } from "bun:test";

test("creates a user", async () => {
  const repo = {
    findByEmail: mock(async () => null),
    insert: mock(async () => undefined),
  };

  await createUser(repo, "a@example.com");

  expect(repo.findByEmail).toHaveBeenCalledWith("a@example.com");
  expect(repo.insert).toHaveBeenCalledWith({
    email: "a@example.com",
  });
});
```

This test knows the exact call sequence and the exact internal steps.

A valid refactor can break the test even when the behavior does not change.

For example, the implementation can use an atomic `insertIfAbsent` operation. The result is the same, but the mock-based test fails.

Prefer tests that check an observable result:

```ts
test("creates a user", async () => {
  const repo = new InMemoryUserRepository();

  const user = await createUser(repo, "a@example.com");

  expect(user.email).toBe("a@example.com");
  expect(await repo.findByEmail("a@example.com")).toEqual(user);
});
```

This test checks behavior. It does not copy the implementation.

## 3. Patching Often Means That the Code Has No Seam

A seam is a place where you can change behavior without changing the code under test.

Patching creates a temporary seam at test time.

That can be useful for legacy code. It is less useful as the main design method.

Consider this function:

```ts
export async function sendWelcomeEmail(email: string): Promise<void> {
  const user = await db.users.findByEmail(email);
  const message = renderWelcomeEmail(user);
  await mailer.send(message);
}
```

The function depends on global objects. A test must patch `db`, `mailer`, or both.

A better design accepts a small set of collaborators:

```ts
export interface WelcomeDeps {
  users: {
    findByEmail(email: string): Promise<User>;
  };
  mailer: {
    send(message: EmailMessage): Promise<void>;
  };
}

export async function sendWelcomeEmail(
  deps: WelcomeDeps,
  email: string,
): Promise<void> {
  const user = await deps.users.findByEmail(email);
  const message = renderWelcomeEmail(user);
  await deps.mailer.send(message);
}
```

This does not require a large dependency injection framework.

It only requires an explicit seam.

## A Practical Rule

Use patching and mocking when you must isolate legacy code, third-party code, time, randomness, or a difficult system boundary.

Do not use them as the default test design.

When a test needs many patches or many interaction assertions, ask three questions:

1. Does the code hide a dependency?
2. Does the test copy the implementation?
3. Does the code need a clearer seam?

In many cases, the best fix is not a better mock.

The best fix is a better boundary.
