---
title: Decouple Your Harness From Your Inference Provider
description: Keep your agent harness independent from model vendors so inference providers can compete underneath a durable workflow.
pubDate: 2026-08-29
---

OpenAI announced this week that it intends to stop providing its models to Cursor after Cursor's acquisition by SpaceX. The proposed cutoff date is November 12, 2026. OpenAI says it does not trust SpaceX to operate its technology within its terms of service. [OpenAI announcement](https://openai.com/index/our-decision-on-cursor-following-its-acquisition-by-spacex/)

Whatever you think about the dispute, it exposes an architectural problem for Cursor users.

If you depend on Cursor but want access to OpenAI models, you may soon have to choose between your harness and your inference provider. Nothing changed in your repository. OpenAI's models did not become technically incompatible with Cursor. Two companies changed their commercial relationship, and the models disappeared from your development environment.

That is a bad seam.

Your harness should let you switch inference providers without rebuilding your workflow.

## The harness is the durable part

An AI coding tool is two things: a model and the harness around it.

The model supplies intelligence. The harness supplies the agent loop, tools, context management, file editing, permissions, subagents, prompts, routing, and terminal integration that let the model work on a repository.

Those layers change at different rates.

The best coding model today may not be the best model six months from now. It may not even be the best model for every task today. I do not need an expensive frontier coding model for basic research or a mechanical transformation. Gemini Flash may be fine. A difficult implementation might justify something substantially more expensive.

My workflow should not care.

The harness is where my configuration, tools, prompts, permissions, extensions, and habits accumulate. That is the part I want to keep. The model should be replaceable.

## Model access is a supply chain

Developers often evaluate model support like a feature matrix:

Does it support OpenAI models? Claude? Gemini?

When the harness vendor mediates access, the dependency graph is closer to this:

`Developer → Harness vendor → Vendor contract → Inference provider → Model`

Every edge can break. Providers change prices and rate limits. Harness vendors renegotiate contracts. Companies acquire each other. Terms change. Models get deprecated. Access disappears.

The useful question is not whether a harness offers the model you want today. It is whether you control the connection between them.

Models may be the fastest-moving dependency we have ever added to a development workflow. Tying the whole agent environment to one vendor's commercial arrangements is a strange way to consume them.

## Inference vendors have different incentives

OpenAI makes Codex. Anthropic makes Claude Code. Both are capable products built by companies whose primary business is selling inference.

A coding harness is partly a distribution channel for that inference. Tool calls, retries, larger contexts, subagents, and longer sessions all consume more of the thing its maker sells.

This does not require sinister motives or deliberately wasteful software. The incentives are simply less clean. An independent harness whose users buy tokens elsewhere has a direct reason to be ruthlessly economical. Wasted inference makes the product worse without making its developer any money.

Model selection has the same problem. An independent harness can decide that a cheap Google model is enough for one task, Claude is better for another, and an OpenAI model is better for a third. A model vendor is unlikely to make its flagship coding product excellent at routing your inference spend to competitors.

That follows from the business model.

## Bundled does not mean better

Training a great model and building a great harness are different engineering problems.

Model research does not automatically produce the best tool execution, context management, terminal UX, editing protocol, extension system, subagent architecture, or agent loop. Sometimes vertical integration works. Sometimes it produces a secondary product whose job is to sell more of the primary one.

In my experience, independent open-source harnesses such as Hermes and Oh My Pi are better than Codex or Claude Code. They give me more control over prompts and tools, better routing, and more efficient use of context. I can extend them instead of waiting for a vendor roadmap. Most importantly, they treat the model as a component rather than the product's identity.

[Hermes](https://github.com/hermes-agent-org/hermes/blob/main/website/docs/integrations/providers.md) supports OpenAI, Anthropic, Gemini, OpenRouter, several Chinese providers, Hugging Face, self-hosted OpenAI-compatible endpoints, and fallback routing. Switching models is part of the product.

[Oh My Pi](https://github.com/bit-cook/oh-my-pi-coding-agent) takes the same position for coding. It supports dozens of providers alongside LSP and debugger integration, subagents, extensions, and a large tool surface.

That is what I want from a harness: serious software whose job is to make models useful, not a model with a terminal attached.

## Open source preserves the seam

Provider independence does not require open source. A proprietary harness could support every provider fairly.

But the harness is becoming one of the most privileged parts of the development environment. It can read the repository, run shell commands, modify files, call external services, retain context, spawn subagents, and decide what gets sent to which model. I do not particularly want that layer to be an opaque appliance.

Open source also protects the provider boundary itself.

If an integration breaks, it can be fixed. If a new model appears, support does not need to wait for a product manager to decide whether a competitor belongs on the roadmap. If a tool is missing, I can add it. If a design decision is bad, I can inspect it, patch it, or fork the project.

This is not an ideological argument. It is about control over a layer whose job should be preserving control.

## Keep the decisions separate

The model market will stay volatile. Frontier leadership will change. Prices will fall. Specialized and open-weight models will improve. Providers will add APIs, retire models, merge, sue each other, and occasionally stop doing business together.

Your workflow should assume all of that will happen.

Choose the harness you actually want, then let inference providers compete underneath it. Use an OpenAI model for one task, Claude for another, and Gemini Flash when cheap and fast is enough. Change those choices tomorrow without rebuilding your development environment.

Pick the best harness. Pick the best model for the job. Keep those decisions separate.
