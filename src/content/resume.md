# Tyler Chambers

## Profile

Full-stack software engineer with 10+ years of experience building financial, infrastructure, and developer-facing systems in Python and TypeScript. I routinely own product work end to end, from data models, APIs, asynchronous workflows, and infrastructure through React applications, client-side data fetching, and production rollout.

My strongest depth is in backend and infrastructure engineering, particularly systems where correctness and failure behavior matter: Bitcoin custody, authentication and authorization, distributed application workflows, and operational tooling. I also spend significant time building and thinking about AI agents, especially tool-using systems, execution environments, orchestration, and the engineering required to make probabilistic software reliable enough to use in production.

## Core Expertise

**Full-Stack Application Engineering:** TypeScript, React, TanStack Query / React Query, Vite, Bun, Python, Flask, FastAPI, Go, REST APIs, client/server application architecture, asynchronous workflows, domain modeling

**Data & Infrastructure:** PostgreSQL, Redis, Kubernetes, AWS, Docker, Linux, CI/CD

**Reliability & Security:** authentication and authorization, application security, Datadog APM, OpenTelemetry, Prometheus, Splunk, structured logging, auditing, performance analysis, failure handling

**AI & Agent Systems:** LLM application architecture, tool-using agents, execution runtimes, orchestration, guardrails, evaluation, observability

## Experience

### Senior Software Engineer
**Unchained** · Remote<br />
**Mar 2022–Present**

- Led the design and implementation of **Connections**, Unchained’s system for sharing Bitcoin public keys and vault access between clients. Owned the project from technical design and specification through PostgreSQL models and migrations, Python services and APIs, and React/TypeScript workflows and data-fetching hooks, including sharing and revoking access across vault and lending products.

- Expanded Unchained wallets from single receive/change addresses to **gap-limit address lookaheads**, precomputing and monitoring addresses across both derivation paths for vault, loan, and other custody products. Reworked backend models, APIs, and React application flows that had previously assumed wallets exposed only a current and next address.

- Made **vault, loan, and rekey wallet provisioning asynchronous**, replacing blocking HTTP workflows with queued, retryable provisioning. This removed database-lock contention around shared Unchained keys and allowed concurrent provisioning requests to complete reliably while preserving predictable behavior for the frontend application.

- Designed and implemented **Proprietary Keys**, allowing Unchained and external platform participants to register multiple Bitcoin keys and control which products each key may be used for. Built the underlying key-assignment model, APIs, and React/TypeScript interfaces used to select eligible keys for vaults, loans, treasury operations, and related custody workflows.

- Worked extensively on **authentication and authorization security** across both application layers, including access-control enforcement, CAPTCHA and passkey flows, login information-disclosure issues, and regression coverage for security-sensitive behavior.

- Implemented **Datadog APM and structured event logging** across a production Flask application, replacing much of the application’s Prometheus-based observability. Instrumented latency and failure paths, managed high-cardinality telemetry, and turned previously silent failures into traceable events and operational dashboards.

### Software Engineer
**Pizza Hut** · Louisville, KY (Hybrid)<br />
**Jun 2021–Mar 2022**

- Improved reliability of an internal **Python/Flask key-management service** that integrated with Fortanix for HSM-backed retrieval of LUKS encryption keys.

- Tuned uWSGI, Nginx, and application timeout behavior for long-running cryptographic operations, reducing request failures from roughly **75% to effectively zero**; added unit tests and established CI build/test pipelines for a service that previously had little automated coverage.

- Designed and documented a **virtualized golden-image capture workflow** to replace a process dependent on dedicated physical hardware. Validated the VM-based approach, documented the capture procedure, and trained engineers on the new workflow, reducing image-creation time and removing much of the hardware coordination required by the existing process.

### IT Resident
**Google**<br />
**2018–2020**

- Provided high-volume remote technical support for Google employees across the Americas, handling multiple concurrent support sessions and troubleshooting Linux desktops, developer workstations, networking, authentication, hardware, and internal tooling.

- Led **Linux/Unix training for incoming IT Residents**, covering Google’s internal desktop Linux environment, command-line fundamentals, system troubleshooting, and common support issues. Created and maintained operational documentation for recurring workstation problems, including recovery procedures for NVIDIA driver failures on Linux developer machines.

#### Borg Cluster SRE — Engineering Rotation

- Contributed production code to **SRSLY (Seriously), Borg’s safe-removal service**, used by SREs to coordinate potentially disruptive maintenance and removal operations across Google’s cluster infrastructure.

- Extended the service’s safety checks and operator visibility around high-risk removal operations, incorporating additional cluster state into decision-making and beginning work toward stronger warnings and authorization controls for dangerous actions.
