import AiProvider from './AiProvider';
import axios from 'axios';

export class HuggingFaceProvider extends AiProvider {
  private token: string;
  private model: string = 'mistralai/Mistral-7B-Instruct-v0.2';

  constructor(token?: string, model?: string) {
    super();
    this.token = token || process.env.HUGGINGFACE_TOKEN || '';
    this.model = model || 'mistralai/Mistral-7B-Instruct-v0.2';
  }

  async generate(prompt: string): Promise<string> {
    if (!this.token) {
      throw new Error('HUGGINGFACE_TOKEN not configured');
    }

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            return_full_text: false,
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        }
      );

      if (Array.isArray(response.data)) {
        return response.data[0]?.generated_text || '';
      }
      return response.data.generated_text || '';
    } catch (error: any) {
      console.error('HuggingFace error:', error.response?.data || error.message);
      throw new Error(`HuggingFace API error: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.token;
  }
}

export default HuggingFaceProvider;
