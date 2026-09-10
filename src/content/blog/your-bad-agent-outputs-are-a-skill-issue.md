---
title: Your Bad Agent Outputs Are a Skill Issue
description: If your coding agent produces code you wouldn't have written, encode your preferences as skills instead of repeating them in prompts.
pubDate: 2026-09-10
---

Agents default to the statistical average of their training data. When you ask for code in an empty directory, you get everyone's code, not yours. Your preferences are variance, and the model can't guess variance.

This is less visible in existing codebases. The agent reads the surrounding files and copies the conventions it finds, so the output looks right. In greenfield work there is nothing to copy, so you get defaults everywhere: whichever validation library is most popular, a directory layout from a tutorial, error handling you would never write.

The usual response is to put your preferences in the prompt. This works for one conversation and then disappears. You re-explain the same things in every session and every project.

The fix is to write them down once, as skills.

A skill is a markdown file describing how you work in a given situation, loaded into context when that situation applies. For example:

- `scripting`: one-off scripts get a single file, argparse, print statements. No config system, no error hierarchy, no src directory. Optimize for time to working, not maintainability.
- `typescript`: strict tsconfig, no `any`, zod at the boundaries with inferred types everywhere else, which ORM you use, how you organize routes and shared types.
- `security-critical`: crypto from a vetted library only, validation at every trust boundary, secrets never logged, auth decisions documented with reasoning. Bias toward refusing ambiguous requests instead of guessing.

These conflict with each other on purpose. A one-off script and a production service want different defaults, which is why you want several small skills rather than one large "how I code" document.

Write them when the gap becomes visible. When the agent produces something you'd have done differently, add what you would have done to the relevant skill. Over time the skills cover most of your greenfield work, and the agent's output in a fresh project stops being an average of everyone's code.

Track the skills in a repository of their own, separate from any project. They are personal tooling, not application code, and keeping them versioned means they survive project churn and can improve incrementally. Publish it so the skills CLI can install from it:

```bash
npx skills add tylerchambers/skills --skill tyler-typescript-style --global
```

This installs the skill into whichever agent you use and keeps a fresh project from starting with nothing. My own repository is at [tylerchambers/skills](https://github.com/tylerchambers/skills).

If you're typing the same corrections into prompts repeatedly, that's the signal. Each repeated correction is a skill that doesn't exist yet.