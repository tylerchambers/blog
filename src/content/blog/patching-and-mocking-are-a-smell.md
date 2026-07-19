---
title: Patching and Mocking Are Usually a Smell
pubDate: 2026-07-19
---

Patching and mocking are useful. They are also overused.

A large mock setup is often treated as evidence that the code is well isolated. Frequently it proves the opposite. The test needs to reach inside the program, replace hidden dependencies, and assert internal call sequences because the design did not provide a clean seam in the first place.

There are three common failure modes.

## 1. Patching Usually Means the Dependency Is Hidden

Consider a function that reads directly from the file system:

```ts
import { readFile } from "node:fs/promises";

export async function loadConfig(): Promise<string> {
  return readFile("./config.json", "utf8");
}
```

The obvious test patches `readFile`.

That works, but the test is compensating for the design. Nothing in the function signature tells the caller that this function performs I/O. The dependency exists, but it is hidden inside the module.

Make it explicit instead:

```ts
export interface FileReader {
  read(path: string): Promise<string>;
}

export async function loadConfig(
  files: FileReader,
): Promise<string> {
  return files.read("./config.json");
}
```

The test becomes ordinary:

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

No patching. No import tricks. The dependency is visible where it belongs.

## 2. Mock-Heavy Tests Often Reimplement the Function

Mocking is especially dangerous when the test asserts every interaction:

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

This test does not merely check that a user was created. It encodes the current algorithm: first query, then insert, with these exact calls.

That distinction matters. The implementation could later use an atomic `insertIfAbsent` operation. The behavior would remain correct, but the test would fail because it was coupled to the old implementation.

Prefer a small in-memory implementation and assert the result:

```ts
test("creates a user", async () => {
  const repo = new InMemoryUserRepository();

  const user = await createUser(repo, "a@example.com");

  expect(user.email).toBe("a@example.com");
  expect(await repo.findByEmail("a@example.com")).toEqual(user);
});
```

This test checks behavior. It does not duplicate the internals of the function under test.

## 3. Patching Creates a Seam After the Fact

A seam is a place where behavior can vary without editing the code under test.

Patching creates that seam dynamically at test time. That is useful when working with legacy code or a hostile third-party API. It is a poor default for code you control.

Consider this:

```ts
export async function sendWelcomeEmail(
  email: string,
): Promise<void> {
  const user = await db.users.findByEmail(email);
  const message = renderWelcomeEmail(user);
  await mailer.send(message);
}
```

A test must patch `db`, `mailer`, or both because the function reaches into global state.

The better version is not complicated:

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

This is dependency injection in the useful sense of the term: pass the thing the function needs. No framework is required.

## The Rule

Use patching when you are trapped by legacy code, global APIs, time, randomness, or a dependency you cannot reasonably wrap.

Do not make it your default testing strategy.

When a test needs several patches or a long list of interaction assertions, the problem is often one of these:

1. The code hides a dependency.
2. The test is coupled to the implementation.
3. The design lacks a usable seam.

In those cases, the answer is usually not a more sophisticated mock.

It is a better boundary.
