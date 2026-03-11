/**
 * PII Redaction & Data Masking Utility
 * 
 * Intercepts and sanitizes text/code payloads before they are sent to external or internal LLM gateways.
 * Prevents accidental leakage of sensitive credentials, emails, internal IP addresses, or secrets.
 * 
 * Note: These regex patterns are aggressive to prioritize security over code compilation,
 * since the resulting output is only used for vector embeddings, not execution.
 */

// ─── PII Regex Patterns ───────────────────────────────────────────────────────
const SCRUBBERS = [
    // Emails
    { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[REDACTED_EMAIL]' },
    // IPv4 Addresses (naive match)
    { regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[REDACTED_IP]' },
    // Common API Keys / Secrets (High entropy strings assigned to obvious variable names)
    { regex: /(api_?key|secret|token|password)[\s:=]+(['"])[a-zA-Z0-9_\-.~]{16,}?\2/gi, replacement: '$1: "[REDACTED_SECRET]"' },
    // AWS Access Key ID
    { regex: /(?<![A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])/g, replacement: '[REDACTED_AWS_KEY_ID]' },
    // JWT Tokens (Header.Payload.Signature)
    { regex: /ey[A-Za-z0-9-_=]+\.ey[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, replacement: '[REDACTED_JWT]' },
    // Bearer Tokens in headers
    { regex: /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g, replacement: 'Bearer [REDACTED_TOKEN]' },
];

/**
 * Scrubs all personally identifiable information (PII) and internal secrets from the input string.
 * @param input Raw text or code snippet to be sanitized
 * @returns Sanitized string safe for LLM ingestion
 */
export function sanitizePayload(input: string): string {
    if (!input) return input;

    let scrubbed = input;
    for (const scrubber of SCRUBBERS) {
        scrubbed = scrubbed.replace(scrubber.regex, scrubber.replacement);
    }

    return scrubbed;
}
