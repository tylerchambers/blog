---
title: What Have I Been Up to with Agents?
description: Using Hermes for personal tracking, group chats, Amazon returns, and appointments, with small CLIs and enough access to get things done.
pubDate: 2026-10-10
---

I've been spending a lot of time lately working with long-running agents, specifically [Hermes](https://hermes-agent.nousresearch.com/). I originally set it up as a curiosity, but it's become pretty integral to my day-to-day. Here's what I've learned as I continue to shovel mundane tasks off to this thing.

## Keeping personal data

Giving an agent access to databases through bespoke CLIs has been incredibly useful, both for storing data and for doing computation against it.

There are already a few places to put information you want an agent to recall. Memory might be a simple `MEMORY.md` file or a more involved provider like [Mnemosyne](https://mnemosyne.site/). `SOUL.md` holds personality and base behavioral guidance. Skills describe repeatable processes. These are useful, but none is where I want to keep a history of meals or ask for calorie totals. SQLite and an associated CLI fit that much better.

As a longtime MyFitnessPal user, I find tracking calories and macros useful. I wanted to own that data rather than keep it in an external service, so I asked Hermes to build a SQLite-backed Rust CLI for macro tracking. The interface is agent-friendly: complete commands in one invocation, JSON output, and ways to query and correct records. A skill explains how to use it. For my single-user setup, this has been sufficient without adding an MCP server.

Combined with Firecrawl for nutrition lookups and image tools for reading labels I send over Telegram, this has been nearly perfect for macro tracking. I tell Hermes what I ate, and it records it. When I ask for totals, the tool calculates them. I don't need the model to remember every meal or do the arithmetic itself.

Exposing this data has also been useful in ways I didn't initially expect. With a history of what I actually eat, Hermes has become good at helping me put together shopping lists. I live in BFE, without the grocery delivery options that would let it finish the loop by ordering everything, but eventually we may get there.

I now track daily weight and lifting sessions the same way, through individual CLIs backed by SQLite. The conversation is a convenient interface, while the underlying records stay structured and queryable.

For information that doesn't need a database, I've also given Hermes an about-me directory and other reference files. Longer background material belongs there rather than in a small memory note. It can read the relevant files when it needs them.

## Turning web apps into CLIs

Another surprise has been how easy it is to build agent-friendly CLIs from HAR files. A HAR is a capture of the requests your browser makes while you use a site. Some apps I use don't have a native CLI or a convenient API for what I want, but capturing those requests has been enough for Hermes to build the relevant operations.

That's how my GroupMe CLI was made. Hermes can now read the group chats I use to keep up with local events. I expected building that integration to be much more work than it was.

HAR files can contain credentials and private data, so they need to be handled accordingly. Undocumented endpoints can also change. This isn't a maintenance-free integration, but it has been a useful way to get access to services I already use.

## Making repeated lookups cheaper

I've also been using self-hosted services to make repeated tasks cheaper. Hermes has access to a Miniflux instance subscribed to RSS sources I care about, so articles come in through feeds instead of requiring a fresh web search every time I want to catch up. I have a weather CLI for similar reasons: a recurring lookup doesn't need to become a new web research task each time.

Web search credits and repeated model work add up. When I find myself asking for the same kind of thing regularly, "can I make this a CLI?" has become a useful question. A predictable command is often cheaper and more reliable than having the agent figure out how to retrieve the same information again.

## Giving it enough access to help

More access has generally been a net positive. I stored my Amazon credentials in Hermes's credential vault, which initially felt like a good way to wake up to $10,000 of random bullshit shipped to my house. That has not happened. What it has done is help me return things before the return window closes.

I have enough executive dysfunction that an item I intend to return can sit around collecting dust until I forget about it. Being able to tell Hermes which item didn't work out and have it process the return, get the confirmation, and remind me to drop it off has been genuinely useful. Printer access is available for labels too, although it hasn't needed to use that yet.

Giving Hermes access to [Bland.ai](https://www.bland.ai/) has also let it make phone calls on my behalf. It has successfully scheduled dentist appointments for me. That is exactly the sort of mundane task I want to delegate: something straightforward that I would otherwise put off.

I suspect some people are more cautious about personal-agent access than they need to be for their own use cases. I'm comfortable exposing my mundane Amazon history to the providers I use. Someone with different privacy requirements may reasonably make a different choice.

That doesn't mean a capable model makes unrestricted access safe. I still want approval before purchases and other consequential actions, and I want the agent to confirm that a task actually completed. But within those boundaries, giving it enough access to act has been much more useful than having it tell me how to do things myself.

Most of this setup is ordinary software: databases, files, small commands, and existing services. The agent lets me use it conversationally and delegate the steps between them. I started by seeing what Hermes could do. Increasingly, I'm giving it the chores I keep forgetting to do and making sure it has what it needs to finish them.
