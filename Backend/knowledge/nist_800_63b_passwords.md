# NIST SP 800-63B Guidelines: Digital Identity Guidelines — Authentication and Lifecycle Management

# NIST SP 800-63B-4 — Simple English Rules & Points

*Source: NIST Special Publication 800-63B-4, "Digital Identity Guidelines: Authentication and Authenticator Management" (July 2025). This is the final published version and replaces the 2017 edition (updated 2020).*

---

## 1. What This Document Is About

- This is a U.S. government standard (from NIST) that explains how to check that someone is who they claim to be when they log in to an online service.
- It focuses on **authentication**: proving a person controls the account they are trying to access.
- It applies to government information systems accessed over a network. Other organizations can use it voluntarily.
- It covers:
  - How strong different login methods need to be (called "Authentication Assurance Levels" or AALs).
  - Rules for specific login methods (passwords, codes, security keys, etc.).
  - What happens when someone enrolls, loses a device, or needs account recovery.
  - How login sessions should be managed.
  - Security, privacy, and usability considerations.
- It does **not** cover physical access (like entering a building) or proving identity in person (that is covered in a companion document, SP 800-63A).

---

## 2. Key Words You Need to Know (Plain English)

- **Claimant** — the person trying to log in.
- **Subscriber** — a person who has an account with the service.
- **Authenticator** — the thing a person uses to prove who they are (a password, a phone app code, a security key, a fingerprint, etc.).
- **Verifier** — the system that checks the authenticator (the login system).
- **CSP (Credential Service Provider)** — the organization that creates and manages accounts and authenticators.
- **RP (Relying Party)** — the app or website the person is trying to access.
- **IdP (Identity Provider)** — in federated login (like "Sign in with Google"), the service that confirms identity to other apps.
- **Factor** — a category of proof. There are three: something you **know** (password), something you **have** (phone, key), something you **are** (fingerprint, face).
- **Multi-factor authentication (MFA)** — using two or more different factor categories.
- **Phishing-resistant** — a login method that cannot be tricked by fake websites (e.g., security keys).
- **AAL (Authentication Assurance Level)** — a strength rating from 1 (basic) to 3 (very high).

**How to read the rules:** Words in CAPITALS have strict meanings in the standard:
- **SHALL / SHALL NOT** = must / must not (mandatory).
- **SHOULD / SHOULD NOT** = recommended / discouraged (not strictly required).
- **MAY** = allowed / optional.
- **CAN / CANNOT** = is possible / is not possible.

---

## 3. The Three Assurance Levels (AAL1, AAL2, AAL3)

### AAL1 — Basic confidence
- The system has basic confidence that the person controls an authenticator linked to the account.
- Allows **single-factor** login (just a password is acceptable).
- Any available login technology can be used.
- Systems **SHOULD** offer multi-factor options at AAL1 and encourage people to use them.
- The person must prove they possess and control the authenticator through a secure login process.

### AAL2 — High confidence
- The system has high confidence that the person controls one or more authenticators linked to the account.
- Requires **two different factors** (e.g., password + phone code).
- The system **MUST** offer at least one **phishing-resistant** login option.

### AAL3 — Very high confidence
- The system has very high confidence that the person controls one or more authenticators linked to the account.
- Must be based on **public-key cryptography** (proving possession of a secret key).
- Requires a **phishing-resistant** authenticator with a **non-exportable** key (the key cannot be copied out of the device).
- Requires **two different factors**.

### Other AAL rules
- A person must log in with a process at least as strong as the level required.
- If a session is already logged in at a lower level and a higher level is needed, the system can do **step-up authentication** to raise the level.
- **Federal agencies MUST use at least AAL2** when personal information is made available online (per Executive Order 13681).
- Fraud indicators (e.g., login from an unexpected location or IP address) **MAY** be used to reduce risk — for example, by asking for extra checks. However:
  - These indicators **do not** change the AAL of a transaction.
  - They **do not** replace an authentication factor.
  - CSPs/verifiers **SHALL** assess how well these indicators work and **SHALL** include them in the privacy risk assessment.
- Accounts can be pseudonymous (the identifier does not have to reveal the person's real name).

---

## 4. Specific Login Method Rules

### 4.1 Passwords
- Passwords are "something you know."
- Rules for passwords focus on **length** more than complexity — longer passwords are stronger (details in Appendix A of the standard).
- Systems should allow long passwords and should not impose unnecessary composition rules (like requiring special characters) that push people toward weak, predictable patterns.
- Password strength should be checked against lists of commonly used or compromised passwords (central or local verification — details in Appendix A).

### 4.2 Look-Up Secrets
- These are pre-printed or pre-shared secret codes the user looks up and enters (like a grid card or recovery code list).
- They count as a "something you have" factor when properly issued.

### 4.3 Out-of-Band Devices
- A separate device (e.g., a phone) receives a code or approval request through a different channel than the login.
- Must be securely linked to the account during setup (binding).
- Protects against an attacker who only has the main login channel.

### 4.4 One-Time Passwords (OTP)
- **Single-factor OTP** — one code proves one factor only.
- **Multi-factor OTP** — combines OTP with another factor to make MFA.
- Codes must be random, time-limited, and protected against guessing (see rate limiting below).

### 4.5 Cryptographic Authentication
- **Single-factor cryptographic** — uses a cryptographic key to prove identity (one factor).
- **Multi-factor cryptographic** — combines cryptographic proof with another factor (two factors).
- At AAL3, cryptographic keys must be **non-exportable** (cannot be copied off the device).

---

## 5. General Rules That Apply to All Login Methods

- **Physical authenticators** — devices like security keys must meet physical protection requirements.
- **Rate limiting (throttling)** — systems **SHALL** limit how many failed login attempts are allowed, to stop guessing/brute-force attacks.
- **Biometrics** — fingerprints, face, etc. can be used, but biometric data must be protected; biometrics alone have special limits (see Section 3.2.3 of the standard).
- **Attestation** — devices may prove their trustworthiness to the system.
- **Phishing resistance** — higher levels (AAL2 and AAL3) require login methods that fake websites cannot trick.
- **Secure communication** — the verifier and CSP/IdP must communicate securely.
- **Replay resistance** — a captured login message cannot be reused by an attacker.
- **Authentication intent** — the login process should confirm the person actually intended to log in (not a background/automatic action).
- **Restricted authenticators** — some authenticators have limited use cases and restrictions.
- **Activation secrets** — secrets used to activate a device must be handled securely.
- **Connected authenticators** — authenticators connected to other devices must be protected.
- **Random values** — all random numbers/codes used must be generated securely.
- **Exportability** — at AAL3, authentication keys must not be exportable (cannot be copied out).
- **Syncable authenticators** (Appendix B, normative) — authenticators that sync keys across devices (like passkey syncing) have specific implementation, sharing, and security requirements.

---

## 6. Managing Authenticators Over Their Lifetime

- **Binding (enrollment)** — securely linking an authenticator to an account when it is first set up. Rules cover binding at enrollment, later binding, subscriber-provided authenticators, and renewal.
- **Account recovery** — what happens when someone loses access. Rules cover recovery methods, recovery requirements by identity/authentication level, and notifying the account holder about recovery events.
- **Loss, theft, damage, compromise** — procedures for when an authenticator is lost or compromised.
- **Expiration** — authenticators may expire and need renewal.
- **Invalidation** — revoking an authenticator when it is no longer valid.
- **Account notifications** — users should be notified about important account/authenticator events.

---

## 7. Session Management

- **Session bindings** — the link between a logged-in session and the user must be protected (e.g., browser cookies, access tokens).
- **Reauthentication** — users may need to log in again after time limits or for sensitive actions.
- **Session monitoring** — systems should watch for suspicious session activity.

---

## 8. Security Considerations (Informative — Guidance, Not Rules)

- Lists **authenticator threats** (Table 3) and **mitigation strategies** (Table 4).
- Covers **authenticator recovery** risks and **session attacks**.
- Explains how to reduce risk at each level.

## 9. Privacy Considerations (Informative)

- Organizations should do a **privacy risk assessment**.
- Apply **privacy controls** and **use limitation** (only use data for stated purposes).
- Agencies have specific privacy compliance obligations.

## 10. Usability & Customer Experience (Informative)

- **Usability** — login methods should be easy to use; the standard gives usability guidance for each authenticator type and for biometrics.
- **Customer success** — organizations should consider the overall user journey and support needs.

---

## 11. Appendices

- **Appendix A (informative)** — Password strength: length matters most; complexity rules have limits; central vs. local password verification; summary.
- **Appendix B (normative)** — Syncable authenticators: how key cloning works, implementation requirements, sharing rules, examples, and security considerations (Table 5).
- **Appendix C (informative)** — List of symbols, abbreviations, and acronyms.
- **Appendix D (informative)** — Glossary.
- **Appendix E (informative)** — Change log (what changed from previous versions).

---

## 12. Quick Reference — The Most Important "Must" Rules

1. AAL2 and AAL3 **MUST** offer phishing-resistant login options.
2. AAL3 **MUST** use public-key cryptography with non-exportable keys.
3. AAL2 and AAL3 **MUST** use two different factors.
4. Federal agencies **MUST** use at least AAL2 when personal information is online.
5. Verifiers **SHALL** limit failed login attempts (rate limiting).
6. CSPs/verifiers **SHALL** assess fraud indicators for effectiveness and include them in privacy risk assessments.
7. Authenticators **SHALL** be securely bound to accounts.
8. Sessions **SHALL** be securely bound and managed.
9. Random values **SHALL** be generated securely.
10. Syncable authenticators **SHALL** meet the requirements in Appendix B (normative).

