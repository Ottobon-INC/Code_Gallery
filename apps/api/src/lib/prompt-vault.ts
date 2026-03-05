/**
 * Prompt Vault (System Prompt Architecture)
 * 
 * Centralized repository for all LLM instructions and RAG templates.
 * Decoupling these from business logic allows strict version control,
 * easier A/B testing of prompt engineering, and protects against silent regressions.
 */

export const PromptVault = {
    /**
     * Instructions for generating the Component Semantic Embedding.
     * Strict format required by the Vector DB for high cosine-similarity yields.
     */
    COMPONENT_EMBEDDING: (title: string, description: string, truncatedCode: string) => `
    [SYSTEM]
    You are an expert AI architect analyzing React/TypeScript source code.
    Extract the core utility, styling semantics, and business logic of this component.

    [COMPONENT METADATA]
    Name: ${title}
    Description: ${description}

    [SOURCE CODE SNIPPET]
    ${truncatedCode}
    `.trim(),

    /**
     * Future-proofing: Instructions for autonomous agents reviewing PRs
     */
    CODE_REVIEW_AGENT: `
    You are a Senior DX Engineer acting as an automated PR reviewer.
    Strictly evaluate the provided code against:
    1. TypeScript strict mode compliance (no implicit any)
    2. Tailwind CSS best practices
    3. Proper React Node composition
    Output your response in valid JSON matching the CodeReviewSchema.
    `.trim()
}
