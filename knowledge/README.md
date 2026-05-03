# Knowledge Vault

This directory is the L3 tier of the agent memory architecture. It is indexed by the **qmd MCP server** for keyword and (after `qmd embed`) semantic search.

Setup:
- The corpus is the markdown files in this directory tree.
- Run `qmd collection list` to confirm this directory is registered.
- Run `qmd embed` once to enable vec/hyde semantic search.
- Run `qmd update` after adding new files.

Usage from agents:
- Lex search: `[{type:'lex', query:'multi-tenant isolation'}]`
- Semantic search (after embed): `[{type:'vec', query:'how do we scope queries by org'}]`

## Structure

```
knowledge/
  sources/     -- Raw notes, articles, snippets to be compiled
  wiki/        -- LLM-compiled concept pages (auto-generated)
  decisions/   -- Architecture Decision Records (ADRs)
  apis/        -- API documentation and contracts
  patterns/    -- Code patterns, conventions, reusable approaches
```

## Frontmatter Schema

All knowledge files should use this frontmatter:

```yaml
---
title: "Descriptive Title"
type: reference | decision | pattern | procedure | api-contract
module: pms | workflows | chat | billing | general
tags: [keyword1, keyword2]
related: [other-file-id1, other-file-id2]
confidence: 0.95
last_verified: 2026-04-17
summary: "One-line description for index scanning"
---
```

## Usage

- Agents search this vault via RAG MCP tools
- The LLM wiki compiler can auto-compile sources/ into wiki/ pages
- Decisions/ tracks ADRs with typed relationships
- Keep files focused (one concept per file) for better retrieval
