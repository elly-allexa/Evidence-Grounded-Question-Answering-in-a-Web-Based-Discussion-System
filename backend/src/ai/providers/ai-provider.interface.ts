export type AiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type GenerateTextInput = {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type GenerateTextResult = {
  text: string;
  provider: string;
  model: string;
};

export interface AiProvider {
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
}
