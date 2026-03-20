import AiProvider from './AiProvider';
import axios from 'axios';

export class GroqProvider extends AiProvider {
  private apiKey: string;
  private model: string = 'llama-3.1-8b-instant';

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
  }

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful study assistant. Always respond in JSON format as specified.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2048,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Groq error:', error.response?.data || error.message);
      throw new Error(`Groq API error: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}

export default GroqProvider;
