# GAME DESIGN DOCUMENT (GDD)
# CyberGuard — Tactical Cybersecurity & AI Defense Training Platform

## 1. Executive Summary & Core Vision
CyberGuard is an immersive, gamified cybersecurity and AI-risk training platform designed for students, professionals, and digital citizens. Built on a cyberpunk hacktivist aesthetic, it combines rigorous industry-standard curricula (NIST, CISA, OWASP, MITRE ATT&CK) with real-time AI mentoring (Cipher) and interactive hands-on mission labs.

---

## 2. The Four Realms (Game Worlds & Curricula)
CyberGuard is structured into four distinct training realms, each tackling a critical threat domain:

1. **The Vault (Passwords & Authentication)**
   - **Core Topic:** NIST SP 800-63B-4 digital identity guidelines, passphrases vs. short complex passwords, password managers, and multi-factor authentication (2FA).
   - **Mechanics:** Crack Lab simulation demonstrating time-to-crack based on entropy; interactive password construction; 2FA practice verification desk.

2. **The Mirage (Phishing & Deception)**
   - **Core Topic:** CISA Secure Our World recognition, email headers, SPF/DKIM/DMARC protocols, and Phish Scale phishing severity ratings.
   - **Mechanics:** Email triage and header inspection; spotting urgency, domain spoofing, and malicious links.

3. **The Whisper (Social Engineering & Manipulation)**
   - **Core Topic:** Social engineering tactics, pretexting, baiting, quid pro quo, and MITRE ATT&CK reconnaissance frameworks.
   - **Mechanics:** Simulated DM chats and phone call triage; identifying psychological manipulation cues and defending personal information.

4. **The Oracle (Safe AI Use & Prompt Security)**
   - **Core Topic:** OWASP Top 10 for Large Language Models (LLM01 Prompt Injection, LLM02 Insecure Output Handling), hallucination verification, and data minimization.
   - **Mechanics:** Prompt-injection lab (interacting with an AI bot to secure or exploit system prompts); fact-checking AI claims against verified sources.

---

## 3. Gameplay Mechanics & Progression
- **Level Gating (DR-03):** Missions are strictly gated. Players must complete previous levels and modules before unlocking advanced scenarios, ensuring foundational mastery.
- **Scoring & XP:** Successful mission decisions award XP, track performance, and update user progress in PostgreSQL.
- **Interactive AI Mentor (Cipher):** An LLM-powered coach that provides dynamic guidance, answers module questions grounded in security standards, and gives context-aware feedback without lecturing.

---

## 4. Technical Architecture
- **Backend:** FastAPI (Python) with SQLAlchemy async, Alembic migrations, PostgreSQL (Neon), JWT authentication, and bcrypt password hashing.
- **Frontend:** Next.js 16 (React, TypeScript, Tailwind CSS) with a custom "Cyber-Goth / Hacktivist" design system.
- **AI Integration:** Groq API integration with strict prompt guardrails, fallback behavior, and stateless privacy preservation.
