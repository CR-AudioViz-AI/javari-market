# Security Policy

## Reporting Security Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

If you discover a security vulnerability in this repository, please email:
**security@craudiovizai.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

We will respond within 48 hours and work with you to resolve the issue.

## Security Measures

This repository implements:

- ✅ **Dependabot** - Automated dependency updates
- ✅ **Secret Scanning** - Prevents credential leaks
- ✅ **Push Protection** - Blocks commits containing secrets
- ✅ **Security Advisories** - GitHub security alerts enabled
- ✅ **Branch Protection** - Requires review before merge

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

We only support the latest version. Please upgrade to receive security updates.

## Security Best Practices

- Never commit `.env` files
- Use environment variables for all secrets
- All credentials stored in platform_secrets table (encrypted AES-256-GCM)
- Bootstrap credentials only in Vercel environment variables
- Review Dependabot PRs weekly
- Keep dependencies up to date

## Disclosure Policy

- We will acknowledge your email within 48 hours
- We will provide a detailed response within 7 days
- We will notify you when the vulnerability is fixed
- We will credit you in the security advisory (unless you prefer anonymity)

---

**CR AudioViz AI, LLC** | Fort Myers, Florida | EIN: 39-3646201
