---
title: Optimize for Review, Not Generation
description: AI coding throughput depends less on generation speed than on fast verification, isolated workspaces, efficient context transfer, and low-friction diff review.
pubDate: 2026-08-13
---

AI has made writing code dramatically cheaper. That does not mean software engineering has become cheap.

The bottleneck has moved.

If an agent can produce a few hundred lines of plausible code in a minute, the limiting factor is no longer typing. It is everything around typing: understanding what changed, detecting mistakes, enforcing local conventions, feeding corrections back into the agent, running verification, and keeping multiple pieces of work moving at once.

The practical goal is therefore not to maximize how quickly an agent can generate code. It is to maximize **throughput through the review loop**.

A useful loop looks something like this:

1. Give the agent enough context to attempt the change.
2. Let it generate code.
3. Run mechanical verification automatically.
4. Inspect the resulting diff.
5. Feed precise corrections back to the agent.
6. Repeat.

Generation is already fast. The interesting engineering work is reducing latency everywhere else.

This changes which tools matter.

## Types Are Part of the Agent Harness

Strong typing was useful before coding agents. It is substantially more useful now.

A type checker is an extremely cheap reviewer that can evaluate the entire change without consuming human attention. More importantly, its output is usually machine-actionable.

If an agent introduces:

```ts
function sendPayment(amount: string) {
  // ...
}
```

into a codebase where the caller passes a branded `Sats` value, I do not want to discover the mismatch while reading the diff. I want the type checker to reject it immediately, and I want the agent to see that rejection and fix it in the same turn.

This is one of the best properties a development tool can have in an agentic workflow:

> It produces deterministic feedback that the agent can immediately act on.

Good typing moves correctness checks out of the human review path.

The more of your domain you can express in the type system, the more mistakes get rejected before you ever look at the code.

That does not mean turning every TypeScript program into a dependent type theory experiment. It means preferring types that make illegal states difficult to represent, using discriminated unions instead of piles of booleans, distinguishing identifiers that should not be interchangeable, and avoiding unnecessary escape hatches like `any`.

The cost-benefit calculation has changed. Types are no longer merely documentation for programmers or protection against future refactors. They are part of the feedback interface between your repository and the agent operating on it.

## Aggressive Linting Is Suddenly Much More Valuable

Developers have historically had an understandable dislike of overly opinionated lint rules.

Some rules feel arbitrary. Some produce noisy diffs. Some enforce style preferences that competent programmers could easily resolve themselves.

That objection matters less when the programmer is an agent.

If there is one canonical way to write something in your repository, encode it mechanically whenever possible.

Prefer:

```ts
const foo = value ?? defaultValue;
```

over holding a recurring team debate about whether someone should have written an explicit null check.

Prefer the linter deciding import ordering.

Prefer the formatter deciding whitespace.

Prefer the repository deciding whether unused variables, floating promises, unsafe casts, or unnecessary assertions are acceptable.

Human attention is expensive. Mechanical enforcement is cheap.

Even mildly annoying lint rules become valuable when they eliminate review comments like:

- use the helper here
- sort these imports
- don't use `any`
- await this promise
- use the existing error type
- remove this unnecessary assertion
- don't construct this manually

Those comments have almost no information content. They are repository policy masquerading as code review.

Repository policy should be executable.

This becomes particularly powerful when the coding agent is wired into an LSP or can run the relevant tools itself. The ideal interaction is not:

> Agent writes code → human sees lint failure → human tells agent → agent fixes code.

It is:

> Agent writes code → lint fails → agent fixes code.

One turn.

That is why tool speed matters more than it used to.

Biome is excellent in this environment because formatting and linting are fast enough that there is little reason not to run them constantly. Oxlint occupies a similar niche: extremely cheap static feedback that can sit directly in the generation loop.

A ten-second lint pass is irritating for a human.

A ten-second lint pass repeated dozens of times by several agents becomes an architectural problem.

Fast tools increase how frequently verification can happen, and more frequent verification shortens the distance between introducing an error and correcting it.

That matters more than almost any marginal improvement in model quality.

## Your Repository Should Be Able to Correct the Agent

There is a larger principle here.

A good repository should contain enough executable knowledge to push an agent toward correct code.

The repository should know:

- what types are valid
- what formatting is valid
- what patterns are forbidden
- how tests are run
- how imports are structured
- which dependencies are permitted
- how generated code should look
- whether a change breaks an invariant

The weaker this machinery is, the more responsibility falls onto human review.

This was always true, but agents amplify the effect because they generate changes so quickly.

A repository with weak tooling can easily become a machine for producing review work.

A repository with strong tooling can reject large classes of bad changes before a person sees them.

## Parallelism Requires Cheap Isolation

Once generation is cheap, another obvious optimization appears: run more than one agent.

This quickly creates a workspace problem.

You cannot have three coding sessions all mutating the same checkout unless you enjoy watching them overwrite each other's work.

Git worktrees are the obvious answer.

```bash
git worktree add ../feature-a feature-a
git worktree add ../feature-b feature-b
```

Now each agent gets its own working directory, branch, dependency state, and filesystem.

This is particularly useful when one agent is working on a backend change, another is writing tests, and a third is investigating an unrelated bug.

That said, worktrees are not mandatory. Multiple repository copies are often simpler and perfectly adequate.

There is a surprisingly widespread assumption that maintaining multiple clones means constantly going back to GitHub to synchronize them.

It does not.

Git repositories can pull from each other locally.

If I have:

```text
~/code/project
~/code/project-agent-1
~/code/project-agent-2
```

one clone can use another as a remote:

```bash
git remote add local ../project
git fetch local
git merge local/main
```

or simply:

```bash
git pull ../project main
```

Git is not a GitHub client. It is a distributed version control system.

Local clones are cheap.

The important thing is not whether you use worktrees or duplicated repositories. The important thing is making isolated workspaces cheap enough that starting another agent does not feel operationally expensive.

Parallel agents only help if managing them is easier than doing the work serially.

## Terminal Multiplexers Become Agent Orchestrators

Once you have several workspaces, you need somewhere to keep the sessions.

This is where terminal multiplexers become unusually useful.

I use tmux because it solves a very old problem extremely well: persistent terminal sessions with cheap switching between independent contexts.

That maps almost perfectly onto agentic development.

One window can contain an agent working on an implementation.

Another can be running tests.

Another can contain a server.

Another can be an investigation session.

Another can be waiting on a long-running command.

The important property is persistence. I do not want my workflow tied to a particular terminal window remaining open, and I do not want long-running agent sessions to disappear because I reorganized my desktop.

tmux turns the terminal into a collection of durable processes rather than a collection of windows.

cmux is worth mentioning here as well. It attacks the same general problem from a more modern, integrated direction and includes some agent-oriented niceties. The exact tool matters less than the capability.

You want to be able to move between several long-running contexts nearly instantly.

Again, the target is throughput.

If switching from agent A to agent B requires reconstructing what B was doing, finding its shell, navigating back to the correct directory, and rediscovering its output, the coordination cost starts eating the parallelism benefit.

## Voice Input Is a Bandwidth Upgrade

One of the stranger consequences of coding agents is that typing can become a bottleneck again, just somewhere else.

Not typing code.

Typing context.

Agents often perform much better when given the messy background knowledge that a programmer would normally keep in his head:

> This endpoint is old and technically deprecated but these two clients still depend on it. The new service has a similar helper but don't use it because it assumes the user already has a custody relationship. There was a production bug six months ago caused by this exact ordering issue. Try to preserve the existing interface because another branch is changing the caller.

Typing that is annoying.

Saying it takes fifteen seconds.

Voice input is useful because it lets you transfer context at approximately the speed you think rather than the speed you type.

For agent prompts, polished prose is often unnecessary. A rambling but information-dense explanation is more useful than a beautifully compressed prompt that accidentally omits three relevant constraints.

I increasingly prefer to dump the entire context into the agent.

Let the model compress it.

Human-to-agent communication is not an API. You do not need to optimize prompts for elegance.

You need to optimize them for information transfer.

## The Diff Is the Primary Interface

The most important interface in an agentic coding environment may not be the chat window.

It may be the diff.

The agent proposes a change. The diff is the artifact you actually need to evaluate.

This is why I built [**diffpeek**](https://github.com/tylerchambers/diffpeek).

I wanted a Git diff viewer optimized around the review loop rather than around passively reading patches.

The critical capability is being able to move through a diff quickly and attach comments that can be handed directly back to the agent.

If line 47 is wrong, I do not want to type:

> In `payments.ts`, inside `createPayment`, around the section where you check the account state, that condition should happen after the authorization check because...

I want to select the relevant line and write:

> Move this below the authorization check. We should not expose account-state information before auth succeeds.

Then export those comments in a format the agent can understand.

This sounds like a minor UX improvement. It is not.

The review-feedback step occurs constantly. Small reductions in friction compound quickly.

A good diff viewer should make it trivial to:

- navigate changed files
- understand the shape of the change
- annotate exact lines
- distinguish blocking issues from questions
- collect feedback
- hand the feedback back to the agent

cmux has also started integrating similar ideas directly into its environment, which makes sense. Once coding happens through agents, reviewing their output naturally becomes a first-class terminal operation.

The chat is where you issue intent.

The diff is where you determine whether the intent was actually satisfied.

## Optimize the Whole Loop

There is a tendency to evaluate coding agents primarily by generation quality.

Model A produced the feature in one prompt.

Model B needed three prompts.

Model C wrote cleaner code.

Those differences matter, but they are increasingly less interesting than the surrounding system.

Imagine two setups.

In the first, the agent is slightly smarter, but:

- type checking takes thirty seconds
- linting takes twenty seconds
- formatting is inconsistent
- tests require manual setup
- there is one shared checkout
- review happens in raw `git diff`
- feedback is manually translated back into prompts

In the second, the model is slightly worse, but:

- type checking is nearly immediate
- lint and formatting run automatically
- repository rules catch common mistakes
- each task gets an isolated workspace
- several sessions can run concurrently
- diffs are easy to inspect
- review comments can be sent directly back to the agent

I would take the second system.

By a lot.

The first optimizes the intelligence of the worker.

The second optimizes the factory.

That distinction will become more important as models converge in capability.

Once code generation becomes abundant, competitive advantage moves toward the infrastructure surrounding generation: verification, context transfer, isolation, review, and feedback.

The best agent setup is not the one that writes the most code.

It is the one that lets you confidently accept or reject the most correct changes per hour.
