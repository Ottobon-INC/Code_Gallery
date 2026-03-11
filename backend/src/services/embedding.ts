import { getEmbedding } from '../lib/llm-provider';
import { sanitizePayload } from '../lib/sanitizer';
import { PromptVault } from '../lib/prompt-vault';

/**
 * Generates an embedding vector for a UI component.
 * It concatenates the title, description, and meaningful parts of the code
 * to create a rich semantic representation of the component's purpose.
 * 
 * @param title The component title (e.g., "StripePaymentUI")
 * @param description The component description
 * @param rawCode The raw TypeScript/React source code
 * @returns A 1536-dimensional number array (text-embedding-ada-002 / text-embedding-3-small)
 */
export async function generateComponentEmbedding(
    title: string,
    description: string,
    rawCode: string
): Promise<number[]> {
    // We want to capture the essence of the code: props, interfaces, and main exports.
    // We don't need every single CSS class, but we'll include a truncated version
    // of the raw code to keep within token limits while preserving context.

    const truncatedCode = rawCode.substring(0, 1500); // Take first ~1500 chars 

    const embeddingText = PromptVault.COMPONENT_EMBEDDING(title, description, truncatedCode);

    try {
        const sanitizedText = sanitizePayload(embeddingText);
        const embedding = await getEmbedding(sanitizedText);
        return embedding;
    } catch (err) {
        console.error(`[Embedding Pipeline] Failed to generate embedding for ${title}:`, err);
        throw new Error('Embedding generation failed');
    }
}
