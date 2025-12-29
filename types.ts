export interface ToolCall {
  state: 'call' | 'result';
  toolCallId: string;
  toolName: string;
  args: any;
  result?: any;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  id: string;
  timestamp: number;
  toolCalls?: ToolCall[]; // Support for pending or completed tool calls
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type AIProvider = 'cerebras' | 'google' | 'openai';

export interface Settings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  theme: 'light' | 'dark';
  language: string; // New Language Field
  // Custom Provider Settings
  provider?: AIProvider;
  customApiKey?: string;
  customModelId?: string;
}

export interface Artifact {
  id: string;
  title: string;
  type: 'markdown' | 'code';
  content: string;
  createdAt: number;
  updatedAt: number;
}

export const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'CEREBRAS' },
  { id: 'llama3.1-8b', name: 'Llama 3.1 8B', provider: 'CEREBRAS' },
  { id: 'gpt-oss-120b', name: 'GPT OSS 120B', provider: 'CEREBRAS' },
  { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B', provider: 'CEREBRAS' },
  { id: 'qwen-3-32b', name: 'Qwen 3 32B', provider: 'CEREBRAS' },
  { id: 'zai-glm-4.6', name: 'Zai GLM 4.6', provider: 'CEREBRAS' },
  { id: 'custom', name: 'Other / Custom', provider: 'EXTERNAL' },
];