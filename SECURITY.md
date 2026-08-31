# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## Reporting a Vulnerability

ReviveAI is built for financial intelligence and automated payment recovery operations. We take the safety and integrity of merchant payment workflows seriously.

If you discover a potential security vulnerability or safety bypass in the deterministic guardrails engine:

1. **Do not create a public issue on GitHub.**
2. Send an email to the maintainers with a detailed description of the vulnerability, reproduction steps, and potential impact.
3. Maintainers will acknowledge receipt within 48 hours and provide a timeline for remediation.

---

## Safety & Guardrails Enforcement

ReviveAI implements deterministic mathematical and logical safety rules to guarantee:
- Prevention of duplicate or unbounded charge attempts.
- Cryptographic-grade audit logging of all state transitions.
- Escalation to human oversight whenever transactional thresholds are reached.
