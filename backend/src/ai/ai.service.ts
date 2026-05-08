import { Injectable } from '@nestjs/common';
import { GroqProvider } from './providers/groq.provider';

@Injectable()
export class AiService {
  constructor(private readonly groqProvider: GroqProvider) {}

  async testPrompt(prompt: string) {
    return this.groqProvider.generateText({
      messages: [
        {
          role: 'system',
          content: 'You are a concise assistant. Answer briefly. This is only a connectivity test.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      maxTokens: 300,
    });
  }
}
