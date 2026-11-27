# CISA Guidance & NIST Phish Scale Framework

## 1. Phishing Identifiers & Red Flags
- Examine sender email addresses carefully for subtle typosquatting or mismatched domains (e.g., lookalike domains designed to spoof legitimate organizations).
- Watch for high-pressure tactics, artificial urgency, threats of account suspension, or unexpected requests for credentials/sensitive info.
- Be aware of hyper-targeted phishing (spear phishing) which uses personal background details to lower the victim's guard.

## 2. Verification Protocol
- Never click links or download attachments directly from unverified emails or suspicious messages.
- Always navigate to the official service directly using a bookmarked URL or official app.
- When in doubt, report the suspicious message to IT/Security and delete it immediately.

# NIST Phish Scale — Simple English Rules & Points

*Source: NIST Technical Note 2276, "NIST Phish Scale User Guide" (November 2023). Authors: Shanée Dawkins and Jody Jacobs (NIST).*

---

## 1. What This Document Is About

- **Phishing** is an email-based cyberattack. Criminals try to trick email recipients into giving up sensitive information, clicking a fake link, or downloading a malicious attachment.
- Phishing is a **social engineering** technique — it manipulates people into doing something that helps the attacker.
- It affects both private and public organizations in the U.S. and worldwide, and costs companies billions.
- Email filters and technical safeguards **cannot block every malicious email**. That means **people are often the organization's last line of defense**.
- **Embedded phishing awareness training programs** send *simulated* (fake) phishing emails to employees to train them to spot real ones.

---

## 2. Why This Method Exists (The Problem It Solves)

- Training programs usually measure success with two numbers:
  - **Click rate** — the percentage of people who clicked a potentially malicious link or attachment.
  - **Reporting rate** — the percentage of people who reported a suspicious email.
- **The problem:** click rates and reporting rates give only *one piece* of the picture — "what percentage of people fell for it."
- They **do not account for the fact that some phishing emails are harder to detect than others**.
- **The NIST Phish Scale** fixes this. It is a method for training implementers to **rate how difficult a phishing email is for humans to detect**.
- It looks at two things together:
  1. The **properties of the phishing email itself**.
  2. The **characteristics of the email's recipients** (their context, roles, and current events around them).

---

## 3. Who Should Use It

- **Phishing awareness training implementers**
- **Cybersecurity awareness training professionals**
- **Other computer security professionals** responsible for designing, running, or analyzing phishing training exercises.

### What the difficulty rating helps you do
1. **Add context to click rates and reporting rates** for a specific target audience.
2. **Characterize real phishing threats** so you can tailor training to the types of threats your organization actually faces.

### Important usage notes
- The method was built using **empirical data** (real research and simulation data), but implementers **should customize it** to fit their organization's environment and employee population.
- You must be **consistent** in how you evaluate emails — consistency is what makes difficulty ratings comparable across different emails.
- The Phish Scale is **one additional metric** within a broader cybersecurity awareness program. It should support, not replace, the overall program and the organization's mission and risk tolerance.

---

## 4. How the Phish Scale Works — Two Main Components

The Phish Scale has **two components**, measured separately and then **interpreted together** to give one overall **human detection difficulty rating**.

| Component | What It Measures |
|---|---|
| **1. Email Cues** | The observable characteristics of the phishing email itself (visual and content clues). |
| **2. Premise Alignment** | How well the email's "story" or premise fits the target audience's current events, organizational environment, roles, and responsibilities. |

**Simple rule of thumb:** Both components are measured first, then combined into the final difficulty rating.

---

## 5. Component 1: Email Cues

### 5.1 What a "cue" is
- A **cue** is a property of an email that either:
  - **tempts** a user to click a fraudulent link or attachment, **or**
  - **alerts** the user that the email may be a phish.
- **The key rule:**
  - **Fewer cues = harder to detect** (the email looks more legitimate).
  - **More cues = easier to detect** (more red flags are visible).
- Counting cues gives an **objective measure** of the email itself.

### 5.2 The Five Cue Types (23 cues total)

| # | Cue Type | Plain English Meaning |
|---|---|---|
| 1 | **Errors** | Spelling and grammar mistakes, inconsistencies in the message. |
| 2 | **Technical indicators** | Problems with email addresses, hyperlinks, and attachments. |
| 3 | **Visual presentation indicators** | Branding, logos, design, and formatting problems. |
| 4 | **Language and content** | Generic greetings, missing signer details, time pressure, threatening language. |
| 5 | **Common tactics** | Humanitarian appeals, "too good to be true" offers, posing as a friend/colleague/authority figure, etc. |

### 5.3 The Full Cue List (Table 1 of the guide)

**Error cues (2):**
1. Spelling and grammar irregularities
2. Inconsistency

**Technical indicator cues (4):**
3. Attachment type
4. Sender display name and email address
5. URL hyperlinking
6. Domain spoofing

**Visual presentation indicator cues (4):**
7. No/minimal branding and logos
8. Logo imitation or out-of-date branding/logos
9. Unprofessional looking design or formatting
10. Security indicators and icons

**Language and content cues (7):**
11. Legal language / copyright info / disclaimers
12. Distracting detail
13. Requests for sensitive information
14. Sense of urgency
15. Threatening language
16. Generic greeting
17. Lack of signer details

**Common tactic cues (6):**
18. Humanitarian appeals
19. Too good to be true offers
20. "You're special"
21. Limited time offer
22. Mimics a work or business process
23. Poses as friend, colleague, supervisor, or authority figure

### 5.4 Where Cues Are Found (Email Anatomy)
An email has **four major parts**:
1. **Header** — includes From, Sent, and To information.
2. **Subject** — the subject line.
3. **Attachment** — any downloadable files, if present.
4. **Message** — includes:
   - **Salutation** (greeting)
   - **Body** (main content)
   - **Closing** (signature)
   - **Postscript** (disclaimers)

**Where each cue type typically appears:**
- **Error** and **Technical indicator** cues — can appear **anywhere** in the email.
- **Visual presentation indicator** cues — usually in the **message** (how the email looks).
- **Language and content** and **Common tactic** cues — usually in the **subject or message** (they relate to the email's premise).

*Note: Exact cue location can vary by email client, user customization, and device.*

### 5.5 How to Count Cues (Categorization Rules)
- Closely examine the email and identify every cue present.
- **Count each instance** of a cue — not just each cue type.
  - Example: 3 spelling errors + 2 grammar errors = **5** "Spelling and grammar irregularities" cues counted toward the total.
- **One email characteristic can count as multiple cues.**
  - Example: A link displayed as "www.niist.gov" (misspelled, should be www.nist.gov) whose underlying URL points to "commerce.gov" counts as **both** a "Spelling and grammar irregularities" cue **and** a "URL hyperlinking" cue.
- **Scoring:** Tally the number of cues and **sum the total**.
- Use the worksheet in **Appendix A** to help count.

### 5.6 Cue Category Mapping
- Once the total number of cues is tallied, it is mapped to a **cue category** (Table 3 of the guide).
- That cue category is then combined with the **premise alignment category** (see below) to determine the overall detection difficulty.

---

## 6. Component 2: Premise Alignment

### 6.1 What it is
- **Premise alignment** measures how well the phishing email's **premise** ("story") fits the target audience.
- It is based on:
  - **Current events**
  - **The organization's environment**
  - **The recipients' roles and responsibilities**
- **The key idea:** If the email's story feels relevant and believable to the recipients, it is **harder to detect**. If it feels off or out of place, it is **easier to detect**.

### 6.2 Premise Alignment Elements
- The guide defines specific **elements** to evaluate for premise alignment (Section 2.2.1).
- Each element is scored using the **Premise Alignment Applicability Scale** (Table 4) and the **Premise Alignment Elements Scoring Criteria** (Table 5).

### 6.3 How to Score Premise Alignment
1. Evaluate each **premise alignment element** against the scoring criteria.
2. Apply the **applicability scale** to determine how relevant/plausible the premise is for the target audience.
3. Use the **Phishing Email Premise Alignment Category Mapping** (Table 6) to assign a **premise alignment category**.

---

## 7. Determining Detection Difficulty (Putting It Together)

- The final **human phishing detection difficulty** is determined by combining:
  - The **cue category** (from the number of cues), **and**
  - The **premise alignment category**.
- These two are cross-referenced in **Table 7 ("The Phish Scale – Detection Difficulty")** to produce the overall rating.
- **Simple logic:**
  - **Few cues + high premise alignment = hardest to detect.**
  - **Many cues + low premise alignment = easiest to detect.**
- The result is a difficulty rating that gives **context** to click rates and reporting rates.

---

## 8. Interpreting Results (Section 3)

- The difficulty rating helps explain **why** an email got a certain click rate or reporting rate.
- A **hard-to-detect email** with a high click rate tells a different story than an **easy-to-detect email** with the same click rate.
- Results help implementers:
  - Understand how well training matches the real threats the organization faces.
  - **Tailor training** to the types of phishing threats most relevant to their organization.
  - Reduce the organization's overall security risk.

---

## 9. Best Practices & Cautions

1. **Be consistent** — apply the same evaluation approach to every email so difficulty ratings can be compared.
2. **Customize** — adapt the method to your organization's environment and employee population.
3. **Treat it as one metric** — the Phish Scale is an additional input, not a replacement for the whole cybersecurity awareness program.
4. **Account for context** — the same email can be harder or easier to detect depending on the audience (prior NIST research found that user context plays a key role in interpreting click rates).
5. **Use the worksheet** — Appendix A provides a worksheet to help count cues and score premise alignment correctly.
6. **Consult the detailed cue descriptions** — Appendix B explains each cue and the research behind it.

---

## 10. Licensing Note

- The NIST Phish Scale is **free to use for academic purposes**.
- **Commercial use requires a license** — companies must contact NIST's partnership office.

---

## 11. Appendices at a Glance

| Appendix | Content |
|---|---|
| **Appendix A** | NIST Phish Scale Worksheet — helps implementers apply the method step by step. |
| **Appendix B** | Detailed cue descriptions with research background — organized by cue type (Errors, Technical Indicators, Visual Presentation Indicators, Language & Content, Common Tactics). |
| **Appendix C** | Glossary of terms. |

### Appendix B detail — what each cue means in plain English

**B.1 Error Cues**
- Spelling and grammar irregularities — mistakes in the text.
- Inconsistency — details in the email that don't match up (e.g., mismatched names or info).

**B.2 Technical Indicator Cues**
- Attachment type — suspicious or unexpected file types.
- Sender display name and email address — mismatch between the displayed name and the actual address.
- URL hyperlinking — the visible link text differs from the actual URL.
- Domain spoofing — the sender's domain imitates a real one.

**B.3 Visual Presentation Indicator Cues**
- No/minimal branding and logos — missing expected logos.
- Logo imitation or out-of-date branding/logos — fake or outdated logos.
- Unprofessional looking design or formatting — sloppy layout.
- Security indicators and icons — fake or misleading security badges.

**B.4 Language and Content Cues**
- Legal language/copyright info/disclaimers — boilerplate that seems off or copied.
- Distracting detail — extra information to distract the reader.
- Requests for sensitive information — asking for passwords, financial data, etc.
- Sense of urgency — pressure to act quickly.
- Threatening language — threats of consequences if the recipient doesn't act.
- Generic greeting — like "Dear Customer" instead of a real name.
- Lack of signer details — no proper signature or contact info.

**B.5 Common Tactic Cues**
- Humanitarian appeals — asking for help with a crisis or charity.
- Too good to be true offers — unrealistically attractive offers.
- "You're special" — flattering the recipient to make them act.
- Limited time offer — artificial deadlines.
- Mimics a work or business process — looks like a normal company procedure.
- Poses as friend, colleague, supervisor, authority figure — impersonation.

---

## 12. Quick Reference — The Most Important Rules

1. The Phish Scale rates **human phishing detection difficulty** — it does **not** replace click/report rates; it adds context.
2. **Fewer cues = harder to detect; more cues = easier to detect.**
3. There are **5 cue types** and **23 cues total**.
4. Count **each instance** of a cue, and remember **one characteristic can count as multiple cues**.
5. **Premise alignment** measures how well the email's story fits the audience's current events, environment, roles, and responsibilities.
6. **High premise alignment + few cues = hardest to detect.**
7. **Consistency** in evaluation is essential for comparisons across emails.
8. **Customize** the method to your organization.
9. The Phish Scale is **one metric** within a broader cybersecurity awareness program.
10. **Academic use is free; commercial use needs a license.**

