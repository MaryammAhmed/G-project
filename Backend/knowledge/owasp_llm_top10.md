# OWASP Top 10 for LLM Applications 2025 — Simple English Rules & Points

*Source: OWASP Top 10 for LLM Applications 2025, Version 2025 (released November 18, 2024).*

---

## 1. What This Document Is About
- A community-driven list of the top 10 security risks for applications built with Large Language Models (LLMs).
- Highlights security issues specific to AI applications for developers and security professionals.

### What's new in the 2025 version
- **Unbounded Consumption:** Resource management and unexpected costs.
- **Vector and Embedding Weaknesses:** Securing RAG and embedding-based methods.
- **System Prompt Leakage:** Developers cannot assume system prompts stay secret.
- **Excessive Agency:** Risks when LLMs are used as autonomous agents.

---

## 2. The Top 10 Risks at a Glance
| # | Risk | One-Line Summary |
|---|---|---|
| LLM01 | Prompt Injection | User input changes model behavior in unintended ways. |
| LLM02 | Sensitive Information Disclosure | Model exposes private or confidential data in output. |
| LLM03 | Supply Chain | Weaknesses in third-party models, data, or tools. |
| LLM04 | Data and Model Poisoning | Tampered training data or weights corrupt behavior. |
| LLM05 | Improper Output Handling | App trusts model output without validation. |
| LLM06 | Excessive Agency | Model has too much permission and can take risky actions. |
| LLM07 | System Prompt Leakage | Hidden system instructions are exposed. |
| LLM08 | Vector and Embedding Weaknesses | Flaws in RAG/vector data storage and retrieval. |
| LLM09 | Misinformation | Model produces false or misleading content. |
| LLM10 | Unbounded Consumption | Model uses too many resources or incurs high costs. |

---

## 3. Key LLM Security Rules & Mitigations
- **Prompt Injection (LLM01) & System Prompt Leakage (LLM07):** Constrain behavior in system prompts, validate output formats, filter inputs/outputs.
- **Sensitive Data (LLM02):** Implement data sanitization, least-privilege access, and tokenization.
- **Supply Chain (LLM03 & LLM04):** Vet suppliers, inspect model provenance, review licenses.
- **Operational Risks (LLM05–LLM10):** Validate model outputs before execution, restrict tool permissions, require human approval for high-risk actions, and enforce rate limiting.