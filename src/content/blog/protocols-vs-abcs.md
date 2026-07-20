---
title: Protocols vs. ABCs
description: When to prefer Python protocols for structural typing and when abstract base classes offer clearer runtime guarantees and deliberate membership.
pubDate: 2026-07-12
---

Structural typing and subtyping is very good. So good that in 2019 Python adopted [Protocols](https://typing.python.org/en/latest/spec/protocol.html) via [PEP 544](https://peps.python.org/pep-0544/). 

After the introduction of protocols, many were excited to begin using them instead of [Abstract Base Classes (ABCs)](https://docs.python.org/3/library/abc.html). However, many developers are overly eager to reach for protocols without considering rather an ABC might fit better.

## Mostly, you should just use a protocol.

Python’s `Protocol` fits both modern type checking and the language’s traditional preference for duck typing. A class need not inherit from `SomeBase`, it only needs to provide the operations that a `SomeBase` consumer users. This makes protocols a good default for application dependencies. 

Conveniently, they also let you completely avoid arguments about the merits of inheritance with your coworkers.  

### DI

For example, let's say you're interacting with a blob store (like s3), and you need to receive documents from s3.

```python
from typing import Protocol


class BlobStore(Protocol):
    def put(
        self,
        key: str,
        body: bytes,
        *,
        content_type: str | None = None,
    ) -> None: ...

    def get(self, key: str) -> bytes: ...
```

Downstream consumers can depend on this narrow interface (protocol?) rather than on a particular SDK of concrete storage implementation. Like so:

```python
class DocumentPublisher:
    def __init__(self, blob_store: BlobStore) -> None:
        self._blob_store = blob_store

    def publish(self, document_id: str, body: bytes) -> None:
        self._blob_store.put(
            f"documents/{document_id}.pdf",
            body,
            content_type="application/pdf",
        )
```

Very nice! Now we can swap out BlobStore with any implementation we like. We can wrap the default s3 client, roll our own, whatever. 

### Adapting third-party and legacy types

Suppose you need to interact with a library whose implementation you do not control. Requiring inheritance from an ABC would force you to wrap an otherwise compatible object in an adapter solely to satisfy the type system.

Protocols avoid that:

```python
from typing import Protocol


class HasName(Protocol):
    @property
    def name(self) -> str: ...


def display_name(value: HasName) -> str:
    return value.name
```

Any existing class with a compatible `name` property works without modification, inheritance, or registration. This is particularly useful when adding types to older duck-typed code.

Adapters still make sense when they translate behavior or reconcile different interfaces. They should not be necessary merely to manufacture a nominal relationship.

### Many sizes fit all

Different consumers often need different slices of the same concrete dependency. With protocols, slice away!

```python
class BlobReader(Protocol):
    def get(self, key: str) -> bytes: ...


class BlobWriter(Protocol):
    def put(self, key: str, body: bytes) -> None: ...
```

A read-only service can depend on `BlobReader`, while another service depends on `BlobWriter`. An ABC tends to encourage a single broader hierarchy such as `BlobStore`, even when individual consumers need much less.

This is effectively interface segregation without requiring implementations to inherit from several nominal interfaces.

### Generic algorithms over capabilities

Protocols work well with type variables when an algorithm requires a capability rather than membership in a hierarchy.

```python
from typing import Protocol, TypeVar


class Comparable(Protocol):
    def __lt__(self, other: object) -> bool: ...


T = TypeVar("T", bound=Comparable)


def minimum(values: list[T]) -> T:
    return min(values)
```

The algorithm does not care what the values are. It cares only that they support the relevant operation.

This is common in reusable libraries: serialization, ordering, hashing, iteration, resource cleanup, parsing, and conversion.

## However, sometimes you should use an ABC

Protocols are excellent when you care about an objet's shape. But not ever abstraction is consumer-owned!

Consider building a framework with a deliberate extension point. In this case, implementations are not objects that happen to expose compatible methods, **they are participants in a lifecycle controller by the framework**. 

### Template Method Pattern

Consider database migrations:

```python
from abc import ABC, abstractmethod


class Migration(ABC):
    def apply(self, connection: "Connection") -> None:
        self._validate(connection)

        with connection.transaction():
            self.up(connection)
            self._record_applied(connection)

    @abstractmethod
    def up(self, connection: "Connection") -> None:
        ...

    @abstractmethod
    def down(self, connection: "Connection") -> None:
        ...

    def _validate(self, connection: "Connection") -> None:
        if connection.read_only:
            raise RuntimeError("Cannot migrate a read-only database")

    def _record_applied(self, connection: "Connection") -> None:
        connection.execute(
            "INSERT INTO applied_migrations (name) VALUES (?)",
            [type(self).__name__],
        )
```

A concrete migration supplies the variable behavior:

```python
class AddUserEmailIndex(Migration):
    def up(self, connection: "Connection") -> None:
        connection.execute(
            "CREATE INDEX user_email_idx ON users (email)"
        )

    def down(self, connection: "Connection") -> None:
        connection.execute(
            "DROP INDEX user_email_idx"
        )
```

This is very clearly more than interfaces for which `Protocol` is primarily useful. `Migration` owns the control, validates the environment, opens the transaction, invokes the subclass hook, and records the result.

**The implementation does not decide how a migration is applied**. It fills in one step of an algorithm defined by the framework.

This is the template method pattern, and it is one of the strongest reasons to use an ABC.

### Deliberate membership

Structural typing can produce accidental compatibility:

```python
class ServerController:
    def up(self, connection: "Connection") -> None:
        ...

    def down(self, connection: "Connection") -> None:
        ...
```

As far as a sufficiently small protocol is concerned, `ServerController` may be a migration. Semantically, it clearly is not.

Neither protocols nor ABCs can prove that `down` correctly reverses `up`, but an ABC at least requires the author to declare their intent:

```
class AddUserEmailIndex(Migration):
    ...
```

That **nominal relationship** is useful when classes are discovered, registered, instantiated, or inspected by a framework:

```
def register_migration(cls: type[Migration]) -> type[Migration]:
    if not issubclass(cls, Migration):
        raise TypeError("Migrations must inherit from Migration")

    migrations[cls.__name__] = cls
    return cls
```

Explicit coupling here is intentional. The subclassing is a deliberate declaration of intent to fit the framework.

### Runtime Enforcement

ABCs also have meaningful runtime behavior. A subclass that fails to implement an abstract method cannot be instantiated:

```python
class BrokenMigration(Migration):
    pass


BrokenMigration()
# TypeError: Can't instantiate abstract class ...
```

ABCs enforce strict **membership**. A subclass that fails to implement an abstract method blocks instantiation (`TypeError`), and `isinstance()` checks follow the explicit inheritance tree.

`issubclass(AddUserEmailIndex, Migration)`

By contrast, although Protocols can be marked `@runtime_checkable`, those checks are intentionally shallow. They establish that the relevant attributes exist, not that their full signatures or behavior are correct.

## To conclude

The simplest way to decide between a protocol and an ABC is to define what relationship you are trying to express.

If you mean:

> I am interacting with an object of a particular shape and only care that it provides a specific capability.

Use a protocol.

If you mean:

> This class is part of a larger system or framework that owns the extension contract, and implementations must deliberately join its lifecycle.

Use an ABC.

Protocols express structural compatibility, ABCs express intentional membership.

Mostly, you should just use a protocol. But when the abstraction represents participation in a framework rather than a capability consumed by a caller, an ABC is often the more accurate tool.
