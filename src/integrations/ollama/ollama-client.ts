import { Ollama } from 'ollama';
import { env } from '../../config/env.ts';

/** Shared Ollama client (one per process). */
export const ollamaClient = new Ollama({ host: env.OLLAMA_HOST });
