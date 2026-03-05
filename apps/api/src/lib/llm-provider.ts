/**
 * Vendor-Agnostic LLM Provider Gateway
 * 
 * Routes embedding generation requests dynamically based on infrastructure config.
 * Supports OpenAI (default) and Local/Sovereign endpoints (e.g., Ollama/vLLM) natively.
 */

import { OpenAI } from 'openai';

interface GatewayConfig {
    provider: 'openai' | 'local';
    apiKey?: string;
    localBaseUrl?: string; // e.g., http://localhost:11434/v1
    embeddingModel: string;
}

const config: GatewayConfig = {
    provider: (process.env.LLM_PROVIDER as 'openai' | 'local') || 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    localBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
};

// Lazy-loaded singleton
let clientInstance: OpenAI | null = null;

function getClient(): OpenAI {
    if (clientInstance) return clientInstance;

    if (config.provider === 'local') {
        console.info(`[LLM Gateway] System Sovereign AI connection via ${config.localBaseUrl}`);
        clientInstance = new OpenAI({
            apiKey: 'local_override', // Required by SDK even if bypassing auth
            baseURL: config.localBaseUrl,
        });
    } else {
        if (!config.apiKey) {
            throw new Error('[LLM Gateway] FATAL: OPENAI_API_KEY missing for primary provider.');
        }
        clientInstance = new OpenAI({ apiKey: config.apiKey });
    }

    return clientInstance;
}

/**
 * Generates an embedding vector through the configured agnostic gateway.
 */
export async function getEmbedding(text: string): Promise<number[]> {
    const client = getClient();
    const normalized = text.replace(/\s+/g, ' ').trim();

    // Contextually switch the model if running local sovereign fallback (unless forced otherwise in ENV).
    const activeModel = config.provider === 'local' && process.env.EMBEDDING_MODEL === undefined
        ? 'nomic-embed-text'
        : config.embeddingModel;

    const response = await client.embeddings.create({
        model: activeModel,
        input: normalized,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
        throw new Error(`[LLM Gateway] No embedding vector returned from provider: ${config.provider}`);
    }

    return embedding;
}
