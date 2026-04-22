---
description: "Cost optimization rules for any code that calls the Anthropic API"
globs:
  - "**/*anthropic*"
  - "**/*claude*provider*"
  - "**/*claude*service*"
  - "**/*llm*service*"
  - "**/*ai*service*"
  - "**/*llm*factory*"
---

# Anthropic API Optimization Rules

When writing or modifying code that calls the Anthropic API:

## Prompt Caching (REQUIRED for multi-turn)
- Add `cache_control: { type: "ephemeral" }` to system prompts and tool definitions
- Place on the LAST item in each cacheable block
- Never include timestamps or per-request data in cached blocks
- Minimum 1,024 tokens needed (2,048 for Opus) for caching to activate
- This saves ~90% on input token costs for multi-turn conversations

## Token Tracking (REQUIRED)
- Log `usage.input_tokens`, `usage.output_tokens`, `usage.cache_read_input_tokens`, `usage.cache_creation_input_tokens` from every response
- Calculate and store estimated cost per call
- Include the feature/endpoint that triggered the call

## Model Selection
- Use Haiku for simple classification, FAQ, extraction
- Use Sonnet for standard generation, code, analysis
- Use Opus only for complex reasoning, security analysis, debugging
- Never hardcode a model without a comment explaining why that tier was chosen

## Batch API
- For non-latency-sensitive jobs (nightly analytics, bulk generation, batch pricing), use `client.messages.batches.create()` for 50% cost savings
- Good candidates: anything that processes >10 items and doesn't need instant results

## max_tokens
- Always set `max_tokens` to the minimum needed, not the model maximum
- For structured output, 1024-2048 is usually sufficient
- For long-form generation, estimate the expected length

## Conversation History
- Trim old messages when context exceeds 50% of the model's window
- For multi-turn, keep system prompt + last N turns, not the entire history
- Summarize older turns if they contain important context
