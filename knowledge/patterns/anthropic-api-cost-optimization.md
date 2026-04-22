---
title: "Anthropic API Cost Optimization Patterns"
type: pattern
module: general
tags: [anthropic, api, cost, caching, batch, tokens, optimization]
related: [prompt-caching, batch-api, model-routing]
confidence: 0.95
last_verified: 2026-04-21
summary: "Patterns for reducing Anthropic API costs: prompt caching, batch API, model routing, token hygiene"
---

# Anthropic API Cost Optimization Patterns

Apply these patterns whenever building applications that call the Anthropic API.

## 1. Prompt Caching (cache_control)

**When**: Any multi-turn conversation, any reused system prompt or tool definitions.

**How**: Add `cache_control: { type: "ephemeral" }` to message blocks that don't change between turns:

```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  system: [
    {
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' }  // <-- cache this
    }
  ],
  tools: tools.map((tool, i) => ({
    ...tool,
    ...(i === tools.length - 1 ? { cache_control: { type: 'ephemeral' } } : {})
  })),
  messages: conversationHistory,
});
```

**Savings**: Cached input tokens cost 90% less ($1.50/M vs $15/M for Opus). Mark the last tool definition and system prompt as cacheable — they're identical across turns.

**Rules**:
- Place `cache_control` on the LAST item in a cacheable block (system prompt, last tool)
- Minimum 1,024 tokens for caching to activate (2,048 for Opus)
- Cache lives for 5 minutes, refreshed on each hit
- Don't put timestamps or per-request IDs in cached blocks — they invalidate the cache

## 2. Batch API (Message Batches)

**When**: Non-latency-sensitive jobs — nightly analytics, bulk content generation, batch pricing calculations, SEO generation, data migration.

**How**:

```typescript
const batch = await client.messages.batches.create({
  requests: items.map((item, i) => ({
    custom_id: `item-${i}`,
    params: {
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: item.prompt }],
    },
  })),
});

// Poll for completion
const result = await client.messages.batches.retrieve(batch.id);
```

**Savings**: 50% discount on all tokens. Results available within 24 hours (usually faster).

**Good candidates**: Pricing recalculation, guest message analysis, listing SEO generation, report generation, bulk data enrichment.

## 3. Model Routing

**When**: Application has tasks of varying complexity.

| Task Complexity | Model | Cost/M Input |
|----------------|-------|-------------|
| Simple FAQ, classification, extraction | Haiku | $0.80 |
| Standard generation, code, analysis | Sonnet | $3.00 |
| Complex reasoning, security, debugging | Opus | $15.00 |

**How**: Classify the task before calling the API:

```typescript
function selectModel(task: TaskContext): string {
  if (task.requiresSecurity || task.requiresReasoning) return 'claude-opus-4-6';
  if (task.isSimpleClassification || task.isFAQ) return 'claude-haiku-4-5';
  return 'claude-sonnet-4-6';
}
```

## 4. Token Hygiene

- **Track usage**: Log `usage.input_tokens`, `usage.output_tokens`, `usage.cache_read_input_tokens`, `usage.cache_creation_input_tokens` from every API response
- **Set max_tokens**: Always set `max_tokens` to the minimum needed, not the model max
- **Trim conversation history**: Don't send the full history when only recent context matters
- **Structured output**: Use `response_format: { type: 'json' }` or tool use to get structured responses — they're shorter than prose

## 5. Usage Logging Schema

Every API call should log:

```typescript
interface ApiUsageLog {
  timestamp: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  estimatedCost: number;
  endpoint: string;  // which feature triggered this
  orgId?: string;    // for multi-tenant tracking
}
```
