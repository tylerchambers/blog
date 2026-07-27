# Tyler Chambers

## Summary

Senior Software Engineer with 10+ years of experience building secure web applications, backend platforms, and infrastructure, with staff-level scope across architecture and cross-functional delivery. Leads complex systems from domain modeling and database migrations through APIs, asynchronous workflows, React interfaces, testing, and production operations. Deep experience in TypeScript, Python, authorization, financial technology, Bitcoin custody, distributed systems, and reliability engineering.

## Technical Skills

- **Languages:** TypeScript, JavaScript, Python, Go, SQL, Bash, C++
- **Web & Backend:** React, React Query, Node.js, Bun, Flask, REST APIs, background jobs, state machines, domain-driven design
- **Data & Infrastructure:** PostgreSQL, Redis, Docker, Kubernetes, Helm, AWS, Linux, CI/CD, Git
- **Architecture & Security:** System design, distributed systems, authentication, authorization and ACLs, public key infrastructure, secure software design, observability, performance, automated testing
- **Leadership:** Technical strategy, architectural design, cross-functional delivery, project leadership, code review, engineering standards, documentation

## Experience

### Senior Software Engineer, Unchained

*March 2022 – Present*

- Lead staff-level architecture and delivery across a Python/Flask and React/TypeScript platform supporting Bitcoin custody, lending, trading, payments, and institutional account management.
- Designed and implemented the Connections platform across its domain model, database migrations, backend services, APIs, authorization model, and production rollout; implemented the React interface from provided designs. Replaced role- and configuration-based key sharing with granular action- and ACL-based access to organizational keys and vaults.
- Drove a cross-stack redesign of core Bitcoin wallet infrastructure, replacing legacy escrow and current/next-address assumptions with explicit product, wallet, slice, and lookahead abstractions. Increased the number of wallet addresses monitored in advance by 10x while enabling more flexible address generation and wallet lifecycle management.
- Drove wallet provisioning for vaults, loans, and rekeys from synchronous HTTP requests to retryable asynchronous workflows with polling and explicit state transitions, improving resilience for long-running custody operations.
- Built governed key-management workflows spanning change proposals, approval states, quorum validation, participant selection, and execution; extended shared, workspace, and proprietary keys across vault and loan products.
- Hardened authentication and sensitive operations by eliminating credential-response oracles, correcting CAPTCHA and passkey bypass behavior, restoring state-machine-backed login session tracking, restricting risky uploads, and adding extensive regression coverage.
- Delivered compliance and operational systems including append-only, state-machine-backed electronic consent and tax-document delivery preferences; coordinated implementation through product, legal review, backend services, user-facing workflows, and production rollout.
- Improved performance and operability by batching vault-statement balance computation to reduce database round trips, adding production metrics and dashboards, and maintaining extensive backend and frontend test coverage; approximately 40% of meaningful code changes were tests.

### Software Engineer, Pizza Hut

*June 2021 – March 2022*

- Designed, implemented, and tested backend services and APIs for public key infrastructure using Python, Flask, Go, and Docker.
- Refactored a LUKS key-retrieval service built with Flask, Nginx, and Docker, reducing an approximately 75% request failure rate to zero.
- Built and maintained CI build and test pipelines, standardizing delivery across services.
- Designed, documented, and led training for a virtual-machine-based golden-image workflow that replaced physical hardware and substantially reduced image-capture time and operational friction.

### IT Resident / Software Engineer, Google

*2018 – 2020*

- Developed support-ticket routing software used by Google helpdesk staff worldwide, integrating ticket and scheduling systems to automatically reassign work based on service-level objectives and engineer availability.
- Built a Go CLI for interacting with ticketing APIs and parsing operating-system and application logs from ticket attachments, improving support efficiency.
- Provided remote engineering support for more than 100,000 globally distributed Debian-based cloud and physical workstations.
- Led Linux and troubleshooting training for 15 new hires and advanced after-hours sessions attended by approximately 30 engineers.
- Authored operational documentation that reduced resolution time for broken kernel modules after updates from hours to under 30 minutes.

### Site Reliability Engineer – Borg Cluster, Google

*July 2019 – September 2019*

- Developed improvements to a Go, Python, and Protocol Buffers service that protected production compute clusters by requiring multifactor or multiparty authorization for safety overrides.
- Expanded safety checks, audit logging, and operational visibility for override workflows.
- Ported the service CLI from Python to Go, simplifying releases and reducing operational overhead.

### IT Support, Eastern Kentucky University

*2014 – 2017*

- Provided technical support to 15,000 students and 2,000 faculty members in a predominantly Windows-based environment.
- Automated common macOS remediation workflows with AppleScript, reducing average support sessions from 30 minutes to 15 minutes.

## Open Source

### Bitcoin Core — C++, Python, Bash

- Standardized version-flag behavior across multiple binaries and improved warnings in the man-page generation workflow.
- Enabled Python 3.8 lint rules and corrected invalid identity comparisons across the codebase.
- Changed GUI behavior to warn when `settings.json` is unreadable rather than overwriting it.

### btcsuite/btcd — Go

- Fixed an error-message bug involving SegWit acceptance of compressed public keys.
- Updated domain names to fully qualified domain names to eliminate ambiguous DNS resolution.

## Education

**BBA, Computer Information Systems, Cum Laude** — Eastern Kentucky University  
Network Management Concentration; Honors Thesis: *Decentralizing DNS with Blockchain Technologies*
