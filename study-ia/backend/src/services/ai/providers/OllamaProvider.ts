import AiProvider from './AiProvider';
import axios from 'axios';

export class OllamaProvider extends AiProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = process.env.OLLAMA_URL || 'http://localhost:11434', 
               model: string = process.env.OLLAMA_MODEL || 'llama3.2') {
    super();
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048,
        }
      }, {
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.data.response;
    } catch (error: any) {
      console.error('Ollama error:', error.message);
      throw new Error(`Ollama API error: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

export default OllamaProvider;
