---
title: Your Code Reviews Are Training Data
description: How to turn recurring GitHub and GitLab review feedback into validated engineering rules and a reusable code-review skill.
pubDate: 2026-07-30
---

Your GitHub or GitLab instance probably contains years of engineering knowledge that nobody has written down.

Reviewers repeatedly point out the same failure modes:

- This catches an error that should cause the job to retry.
- This authorization check belongs at the service boundary.
- This test is coupled to the implementation.
- This endpoint changed without updating the public contract.
- Please stop constructing an S3 client in the middle of the domain service. I am begging you.

Some of these comments become documentation. A few become lint rules. Most get resolved, disappear into an old pull request, and are rediscovered six months later by another engineer reviewing nearly the same mistake.

Code review is already producing organizational knowledge. We are just storing it in the least reusable form possible: thousands of loosely connected conversations attached to historical diffs.

With a little extraction, embedding, clustering, and human judgment, that review history can become a set of rules for both engineers and code-review agents.

The rough pipeline looks like this:

```text
GitHub or GitLab
    ↓
review threads with code and outcome
    ↓
structured summaries
    ↓
embeddings
    ↓
semantic clusters
    ↓
human analysis
    ↓
candidate rules
    ↓
review skill
```

The individual steps are not especially exotic. The difficult part is preserving enough context to distinguish a recurring engineering principle from one reviewer having a weird afternoon.

## Scrape the Review History

Start by extracting pull requests or merge requests, review threads, replies, and enough surrounding metadata to reconstruct what happened.

For GitHub, this generally means using the REST or GraphQL API. For a self-managed GitLab instance, the API works, but a read-only PostgreSQL replica or restored backup may be more practical at organizational scale.

The useful unit is a review discussion, not an isolated comment.

A comment like:

> This should throw.

means very little by itself. It becomes useful when paired with:

- The repository and pull request
- The file and language
- The relevant diff hunk
- The root comment and replies
- Whether the thread was resolved
- Whether the code changed afterward
- Whether the pull request was eventually merged

Rendered into a bounded context object, the same review might look like:

```text
Repository: payments-service
Pull request: Prevent duplicate webhook delivery
File: src/webhooks/retry.ts
Language: TypeScript

Changed code:
@@ -81,6 +92,14 @@
try {
    await deliverWebhook(payload)
} catch (error) {
    logger.error(error)
}

Discussion:
Reviewer:
This swallows the delivery failure and marks the job successful.
The queue will never retry it.

Author:
Good catch. I changed this to throw RetryableDeliveryError.

Resolved: true
Outcome: code_changed
```

That is much closer to an actual piece of engineering knowledge.

I would store the original source records in an immutable landing table before doing anything clever with them. GitHub and GitLab schemas change, classifiers improve, and eventually you will realize that some field you discarded was actually important.

Every derived record should remain traceable to the original review thread.

## Summarize Before Embedding

You can embed raw review threads directly, but review discussions contain a lot of conversational noise:

```text
nice catch
fixed
ah yeah, makes sense
lol why did I do that
```

Useful evidence, perhaps, but not a particularly good representation of the engineering concern.

A small instruct model can convert each thread into a structured summary:

```text
Concern:
The webhook handler catches a delivery exception but reports
successful completion.

Requested action:
Propagate a typed retryable exception.

Category:
Error handling and retry semantics.

Outcome:
The implementation changed and the thread was resolved.

Applicable scope:
Background job consumers.
```

Preserve both forms.

The raw thread is useful when somebody wants to inspect the evidence. The structured summary is usually better for finding recurring concerns.

This enrichment step can also assign a deliberately boring taxonomy:

```text
correctness
error handling
API contract
architecture
concurrency
resource management
performance
security
testing
observability
maintainability
readability
documentation
style
other
```

Do not begin with 400 exquisitely specific categories. You do not know your taxonomy yet. Start broad, inspect the corpus, and version it as it changes.

## Generate Embeddings

An embedding maps each summary to a vector. Reviews about similar engineering concerns should end up near one another even when they use different vocabulary.

For example, these comments should probably be neighbors:

```text
This catches the exception, so BullMQ thinks the job succeeded.
```

```text
We need to propagate this failure or the message will be acknowledged.
```

```text
Logging the delivery error here prevents the retry policy from running.
```

Keyword search sees different words. An embedding model should recognize the shared concern: a retryable failure is being converted into successful completion.

The embedding code itself is pleasantly uninteresting:

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer(
    "Qwen/Qwen3-Embedding-0.6B",
)

vectors = model.encode(
    summaries,
    batch_size=32,
    normalize_embeddings=True,
)
```

Store more provenance than you think you need:

```text
artifact_id
representation
model_name
model_revision
renderer_version
content_hash
embedding
created_at
```

Otherwise you will eventually have a vector and no reliable way to determine which text, prompt, renderer, or model produced it. Then you get to regenerate everything and call it an infrastructure migration.

For an initial experiment, a few thousand threads in Parquet is enough. You do not need to deploy a majestic distributed vector architecture before verifying that the nearest neighbors are any good.

## Categorize Recurring Concerns

Before clustering, manually inspect nearest-neighbor results.

Take a thread about swallowed exceptions and ask for its ten closest neighbors. If the results are about retry semantics, false-success states, and error propagation, the representation is doing useful work.

If the results are all from the same repository because they contain the same service name, you have mostly built an expensive repository-name matcher.

Fix the representation before reaching for a larger model.

Once retrieval looks reasonable, cluster the vectors. HDBSCAN is a good starting point because it can leave unrelated threads unclustered rather than forcing every review into a category.

That matters. Not every comment represents a reusable engineering principle.

Some comments are:

- Specific to one pull request
- Personal stylistic preferences
- Incorrect
- Superseded by later decisions
- Mostly Steve trying to rename a variable for the fourth time

Noise is a valid result.

For each coherent cluster, inspect central examples, boundary examples, repository distribution, reviewer distribution, acceptance rate, and contradictory cases.

A cluster of 47 comments from six repositories and eight reviewers is interesting.

A cluster of 47 comments from one reviewer correcting the same generated file is something else.

## Humans Still Have to Analyze It

The system can find repetition. It cannot decide by itself that repetition constitutes a good engineering rule.

A candidate rule should have evidence behind it:

```text
Rule:
Background consumers must propagate retryable failures.

Scope:
Queue consumers and webhook delivery workers.

Evidence:
47 review discussions across 6 repositories.

Outcome:
43 discussions resulted in code changes.

Exceptions:
Failures explicitly classified as terminal may be acknowledged
after recording the terminal state.
```

Human review is where you decide:

- Is this actually a rule?
- Is it correct?
- Is it still current?
- Is it global or repository-specific?
- Are there legitimate exceptions?
- Should it become documentation, a test, a linter, or an agent instruction?

This distinction is important. Review history is evidence of engineering judgment, but it also contains stale advice, misunderstandings, local conventions, and opinions delivered with great confidence.

Do not automate your organization's accumulated bikeshedding into policy.

## Have Another Agent Write the Rules

Once humans identify a useful cluster, a stronger reasoning model can convert the source discussions into a candidate rule.

Give the agent:

- Representative examples
- Boundary examples
- Accepted and rejected outcomes
- Repository and reviewer distribution
- Contradictory discussions
- Links or immutable source IDs

Ask for a structured result:

```text
Rule
Rationale
Scope
Exceptions
Detection guidance
Suggested remediation
Supporting evidence
Confidence
```

This is a different job from clustering.

The embedding model finds discussions that appear related. The rule-synthesis agent explains what those discussions have in common and proposes a reusable instruction. A human decides whether the instruction deserves to exist.

Keeping those stages separate makes the output much easier to inspect.

## Wrap the Rules in a Review Skill

Validated rules can finally become a skill consumed by a code-review agent.

A simple skill might look something like:

```markdown
---
name: organization-code-review
description: Review code using rules derived from accepted review history.
---

# Organization code review

Apply these rules when reviewing application code.

## Retryable failures

Background consumers must not convert retryable failures into
successful completion.

Flag code that:

- catches an exception and returns success
- logs a delivery failure without propagating it
- acknowledges a message before durable processing completes

Do not flag:

- failures explicitly classified as terminal
- handlers that persist a terminal state before acknowledging
- errors handled by a documented retry mechanism outside the function

When raising this concern, explain which failure is being swallowed and
which retry or acknowledgment mechanism will be bypassed.
```

The skill should contain concise, actionable rules. It should not contain the entire review corpus or a pile of vague advice like "consider maintainability."

A good rule tells the reviewing agent:

- What to detect
- Why it matters
- Where it applies
- What exceptions exist
- How to explain the concern

Some clusters will produce rules suitable for an agent. Others should become tests, linters, architecture documentation, or nothing at all.

That is fine. The goal is not to maximize the number of rules. The goal is to stop relearning the same engineering lessons one pull request at a time.

## The Actual Loop

Once the first version works, this can become incremental:

1. Extract new review discussions.
2. Rebuild context for changed threads.
3. Classify and summarize them.
4. Generate embeddings only for changed content.
5. Add them to semantic search.
6. Re-run clustering periodically.
7. Review new or shifting clusters.
8. Update the rulebook and review skill.

The result is a review system grounded in the organization's actual engineering history rather than a generic prompt telling an agent to look for "bugs, security issues, and best practices."

GitHub and GitLab already contain the examples, arguments, corrections, exceptions, and outcomes.

The useful move is to treat them as a corpus instead of a graveyard.
