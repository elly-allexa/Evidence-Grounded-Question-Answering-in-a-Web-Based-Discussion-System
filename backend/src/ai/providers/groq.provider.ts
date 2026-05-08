import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Groq from 'groq-sdk';
import { AiProvider, GenerateTextInput, GenerateTextResult } from './ai-provider.interface';

const DEFAULT_GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

@Injectable()
export class GroqProvider implements AiProvider {
  private readonly client: Groq;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableException('GROQ_API_KEY is missing. Add it to backend .env.');
    }

    this.client = new Groq({
      apiKey,
    });

    this.model = process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL;
  }

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: input.messages,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.maxTokens ?? 600,
      });

      const text = completion.choices[0]?.message?.content?.trim();

      if (!text) {
        throw new ServiceUnavailableException('Groq returned an empty response.');
      }

      return {
        text,
        provider: 'groq',
        model: this.model,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException('AI provider request failed. Please try again later.');
    }
  }
}
