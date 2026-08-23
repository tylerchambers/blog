---
title: Choose Your Harness
description: Coding agents are model-harness pairs. Once you're picking among frontier models, the harness — tools, context, loop, defaults — often matters more than which model you chose.
pubDate: 2026-08-23
---

Developers spend a lot of time comparing models.

Claude vs GPT. Opus vs Codex. Gemini vs whatever shipped this week. Benchmarks move, leaderboards move, and every release produces another round of arguments about which model is now best at coding.

I think this is increasingly the wrong thing to optimize.

Once you're using a genuinely state-of-the-art coding model, the difference between models often matters less than the environment you're putting them in.

The harness matters more.

A coding-agent harness determines the loop around the model: what tools it gets, how it searches the repository, what context it sees, how edits are applied, how compiler and test failures are returned, how context is compacted, whether it can delegate work, and how much autonomy it has before returning control to you.

My working hypothesis is simple:

> A weaker frontier model in a good harness can outperform a stronger frontier model in a bad one.

More importantly, you don't need to spend much time finding the perfect model to benefit from this. Pick something near the frontier. Spend your attention on the harness.

## The model is already pretty good

This argument becomes less interesting if we're comparing a frontier model against something dramatically weaker.

Obviously model capability matters. A sufficiently weak model cannot be rescued by better tooling.

But that isn't the choice most developers are making anymore.

The realistic choice is usually between several very capable models that can all understand a codebase, use tools, write competent code, and recover from mistakes. Their relative strengths differ, but they are operating in roughly the same regime.

At that point, the surrounding system starts to dominate more of the experience.

Did the agent find the right file?

Did it inspect the existing abstraction before inventing another one?

Can it navigate symbols accurately?

Can it run the code?

Can it see diagnostics?

Can it delegate three independent investigations instead of doing them sequentially?

Can it make a precise edit without rewriting half the file?

Those questions are mostly not about model intelligence.

They are about the harness.

## Context is an engineering problem

Context-window size gets a disproportionate amount of attention.

A huge context window is useful, but filling it with source code is not the same thing as giving an agent good context.

The harder problem is selecting the right information at the right time.

A good harness gives the model cheap ways to answer:

- Where is this behavior implemented?
- What references this symbol?
- What pattern does the rest of the repository use?
- Which tests exercise this path?
- What changed after my edit?
- What errors did the compiler or language server find?

That is more useful than indiscriminately shoving another hundred thousand tokens into the prompt.

A good harness manages the model's attention.

## Tools are part of capability

The model doesn't operate directly on your repository. It operates through whatever interface the harness exposes.

That interface matters.

Give an agent a language server and it gets definitions, references, symbols, diagnostics, renames, and code actions as structured operations instead of approximating them with grep.

Give it fast search and repository exploration becomes cheap.

Give it compiler and test feedback and it can stop trying to mentally execute the program.

Give it a reliable patching interface and small edits stay small.

Give it awkward tools and the model will route around them.

This is ordinary interface design applied to an unusual user.

The fact that the user happens to be an LLM doesn't make the ergonomics less important.

## The loop matters too

A coding model producing one answer is not the same system as that model running inside a feedback loop.

An agent can:

1. inspect the code,
2. form a hypothesis,
3. make a change,
4. run tests,
5. observe the failure,
6. update its hypothesis,
7. try again.

A surprising amount of what we perceive as agent intelligence comes from letting a capable model repeatedly interact with reality.

The model does not need to predict everything correctly on the first attempt if the harness makes correction cheap.

This should be familiar to programmers.

A developer with a compiler, debugger, test suite, and shell is much more effective than the same developer writing a patch blind.

## Parallel agents are a harness capability

Parallelism is another good example.

A model can reason about several parts of a problem, but without support from the harness it usually has to investigate them sequentially.

A harness can instead fan work out.

One agent can inspect the database layer while another traces an API path and another looks through tests. They can return their findings to the primary agent, or communicate while the investigation is underway.

Nothing about the underlying model changed.

The system became more capable because the harness gave it another useful primitive.

This becomes particularly valuable for repository archaeology, debugging, reviews, migrations, and other tasks where the work naturally decomposes.

## Good defaults beat theoretical flexibility

There is also a mundane part of harness quality that I think gets overlooked: reasonable defaults.

I don't want to design an agent runtime before asking it to fix something.

I want repository search to work. I want the language server available. I want shell commands to behave normally. I want tests and diagnostics fed back into the loop. I want edits to be precise. I want subagents available when parallelism makes sense.

A harness can expose an enormous amount of configurability and still be unpleasant if the default path is bad.

Good defaults matter because they shape thousands of tiny decisions the agent makes during normal use.

The best harness is not necessarily the one with the longest feature list.

It is the one that makes the correct next action cheap.

## OMP is a good example

This is one reason I've found oh-my-pi, or OMP, interesting.

OMP treats the harness itself as the product.

It gives agents a rich tool environment rather than treating shell access plus file editing as the end of the problem. It includes LSP-backed code intelligence, parallel agents, inter-agent communication, and opinionated defaults intended to make repository work effective without requiring the user to assemble the entire system themselves.

The individual features are useful, but the larger point is more important.

None of them require a better model.

They make the models we already have more useful.

That is the leverage I care about.

If tomorrow's best model appears, you can put it inside the same good harness and benefit from both improvements. The investment in the harness is not wasted when the leaderboard changes.

## A good harness is mostly model-agnostic

There are obviously model-specific quirks.

Different models respond somewhat differently to prompts, tools, context shape, and degrees of autonomy. There will always be some tuning at the edges.

But I don't think we should exaggerate that into "every model requires its own ideal harness."

The basic properties of a good coding environment are remarkably stable.

Good repository navigation is good.

Structured code intelligence is good.

Reliable edits are good.

Cheap feedback is good.

Sensible context management is good.

Parallelism is useful when the task decomposes.

A model that can competently use tools will generally benefit from all of these things.

That makes harness quality a more durable thing to optimize than squeezing another few percentage points out of model selection.

## Choose your harness

Model quality still matters.

If one model is clearly better at the work you're doing, use it. But once you're choosing among state-of-the-art models, I don't think the model deserves most of your attention.

The frontier changes constantly anyway.

The harness is the part you can evaluate more structurally.

Does it help the agent find the right information?

Does it expose the semantics of the codebase instead of just text?

Does it let the agent observe whether its changes worked?

Does it make correction cheap?

Does it support parallel work?

Does it have sane defaults?

Those properties will continue to matter when the next model arrives.

So by all means try the new models.

But spend more time choosing the machine you put them in.
