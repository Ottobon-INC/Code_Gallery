/**
 * OpenAI client singleton.
 *
 * Exposes a single `getEmbedding()` function that converts any text string
 * into a 1536-dimensional float array using text-embedding-ada-002.
 * This vector is then stored in / compared against the `components.embedding`
 * column via pgvector.
 *
 * Usage:
 *   import { getEmbedding } from '../config/openai';
 *   const vector = await getEmbedding('date picker with range selection');
 */

import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    throw new Error(
        '[openai] OPENAI_API_KEY environment variable is not set. ' +
        'Copy .env.example to .env and add your OpenAI API key.'
    );
}

const openai = new OpenAI({ apiKey });

/** The embedding model to use. ada-002 produces 1536-dim vectors. */
const EMBEDDING_MODEL = 'text-embedding-ada-002' as const;

/**
 * Convert a natural-language string into a 1536-dim embedding vector.
 *
 * @param text - The input text (query or component description)
 * @returns A float array of length 1536
 * @throws If the OpenAI API call fails
 */
export async function getEmbedding(text: string): Promise<number[]> {
    // Normalize whitespace — embedding quality degrades on noisy input.
    const normalized = text.replace(/\s+/g, ' ').trim();

    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: normalized,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
        throw new Error('[openai] No embedding returned from the API.');
    }

    return embedding;
}
