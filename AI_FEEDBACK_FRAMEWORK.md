# AI FEEDBACK DESIGN FRAMEWORK
# CyberGuard AI Mentor & Feedback Architecture

## 1. Overview & Purpose
This framework governs how the AI mentor (**Cipher**) and scenario feedback engines operate within CyberGuard. It ensures that AI interactions remain accurate, supportive, reliable, and strictly grounded in recognized cybersecurity standards (NIST, CISA, OWASP, MITRE) while preventing hallucinations and prompt injection vulnerabilities.

---

## 2. Core Architectural Principles
1. **Strict Grounding:** AI responses must draw exclusively from the module's rulebook and pre-defined study anchors tied to recognized standards.
2. **Dynamic Feedback (DR-04):** Feedback is dynamically generated via the Groq API for scenario decisions, reinforcing correct reasoning or explaining risks without shaming the player.
3. **Stateless Privacy (DR-01):** Conversational history and chat queries are processed transiently and never persisted in database storage, ensuring user privacy.
4. **Graceful Fallbacks:** If the AI service encounters connectivity issues or fails validation, the system falls back to verified authored guidance to ensure an uninterrupted learning experience.

---

## 3. Prompt Guardrails & Refusal Handling
- **Vocabulary Constraint:** Responses are tailored to an 8th-grade / 12-year-old reading level, avoiding dense academic jargon.
- **Length & Tone Bounds:** Answers are limited to short sentences (maximum 3 sentences for chat, exactly 2 sentences for scenario feedback) with a confident, playful, supportive tone.
- **Refusal Markers:** If a query falls completely outside the module's rulebook and study anchors, the AI gracefully declines ("I am not sure about that...") and directs the player to the rulebook topic.
