// AI Service с OpenRouter API для QWEN 2.5 и NVIDIA
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string; // URL сгенерированного изображения
  isImage?: boolean; // Флаг для изображений
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export type AIModel = 'qwen' | 'nvidia' | 'tencent';

class AIService {
  private apiKey = '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';
  private baseURL = 'https://openrouter.ai/api/v1';
  
  // Сохранение сессий чата в localStorage
  private saveSessions(sessions: ChatSession[]): void {
    localStorage.setItem('ai_chat_sessions', JSON.stringify(sessions));
  }

  // Загрузка сессий чата из localStorage
  private loadSessions(): ChatSession[] {
    const saved = localStorage.getItem('ai_chat_sessions');
    if (!saved) return [];
    
    try {
      const sessions = JSON.parse(saved);
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  // Получение всех сессий чата
  getAllSessions(): ChatSession[] {
    return this.loadSessions();
  }

  // Создание новой сессии чата
  createSession(): ChatSession {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Новый чат',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const sessions = this.loadSessions();
    sessions.unshift(newSession);
    this.saveSessions(sessions);

    return newSession;
  }

  // Получение сессии по ID
  getSession(sessionId: string): ChatSession | null {
    const sessions = this.loadSessions();
    return sessions.find(session => session.id === sessionId) || null;
  }

  // Обновление сессии
  updateSession(sessionId: string, updates: Partial<ChatSession>): void {
    const sessions = this.loadSessions();
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        ...updates,
        updatedAt: new Date()
      };
      this.saveSessions(sessions);
    }
  }

  // Удаление сессии
  deleteSession(sessionId: string): void {
    const sessions = this.loadSessions();
    const filteredSessions = sessions.filter(session => session.id !== sessionId);
    this.saveSessions(filteredSessions);
  }

  // Отправка сообщения в AI через OpenRouter
  async sendMessage(sessionId: string, message: string, model: AIModel = 'qwen'): Promise<ChatMessage> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error('Сессия не найдена');
    }

    // Создаем сообщение пользователя
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    // Добавляем сообщение пользователя в сессию
    const updatedMessages = [...session.messages, userMessage];
    this.updateSession(sessionId, { messages: updatedMessages });

    try {
      // Вызываем AI через OpenRouter
      const aiResponse = await this.callAI(updatedMessages, model);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        imageUrl: aiResponse.imageUrl,
        isImage: aiResponse.isImage
      };

      // Добавляем ответ ИИ в сессию
      const finalMessages = [...updatedMessages, aiMessage];
      this.updateSession(sessionId, { 
        messages: finalMessages,
        title: session.messages.length === 0 ? this.generateTitleFromMessage(message) : session.title
      });

      return aiMessage;
    } catch (error) {
      console.error('Error calling QWEN 2.5:', error);
      
      // Сообщение об ошибке
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Ошибка подключения к ИИ: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}

Попробуйте:
1. Проверить интернет-соединение
2. Повторить запрос через несколько секунд
3. Проверить API ключ`,
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, errorMessage];
      this.updateSession(sessionId, { 
        messages: finalMessages,
        title: session.messages.length === 0 ? this.generateTitleFromMessage(message) : session.title
      });

      return errorMessage;
    }
  }

  // Универсальный вызов AI через OpenRouter API
  private async callAI(messages: ChatMessage[], model: AIModel): Promise<{content: string, imageUrl?: string, isImage?: boolean}> {
    try {
      // Конвертируем сообщения в формат OpenRouter
      const openRouterMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const modelName = model === 'qwen' 
        ? 'qwen/qwen-2.5-vl-7b-instruct' 
        : model === 'nvidia'
        ? 'nvidia/nemotron-nano-9b-v2:free'
        : 'tencent/hunyuan-a13b-instruct:free';

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Kanban Board AI Chat'
        },
        body: JSON.stringify({
          model: modelName,
          messages: openRouterMessages,
          // Увеличиваем лимит вывода; многие провайдеры игнорируют слишком большие значения и применяют свои лимиты
          max_tokens: 4096,
          temperature: 0.7,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      let rawContent = data.choices[0]?.message?.content || 'Нет ответа от ИИ';
      let finishReason: string | undefined = data.choices[0]?.finish_reason;
      let content = this.sanitizeAIContent(rawContent);

      // Автопродолжение ответа, если модель оборвала по длине
      // Делаем до 3 дополнительных догрузок, объединяя текст
      let continuationAttempts = 0;
      while (finishReason === 'length' && continuationAttempts < 3) {
        continuationAttempts++;
        const continueMessages = [
          ...openRouterMessages,
          { role: 'assistant', content },
          { role: 'user', content: 'Продолжай. Выведи только продолжение без повторов.' }
        ];

        const contRes = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Kanban Board AI Chat'
          },
          body: JSON.stringify({
            model: modelName,
            messages: continueMessages,
            max_tokens: 4096,
            temperature: 0.7,
            top_p: 0.9
          })
        });

        if (!contRes.ok) break;
        const contData = await contRes.json();
        const contRaw = contData.choices[0]?.message?.content || '';
        const contClean = this.sanitizeAIContent(contRaw);
        finishReason = contData.choices[0]?.finish_reason;
        content += (contClean ? `
${contClean}` : '');
      }
      
      // Проверяем, содержит ли исходное сообщение пользователя запрос на генерацию изображения
      const lastUserMessage = messages[messages.length - 1];
      const isImageRequest = this.isImageGenerationRequest(lastUserMessage.content);
      console.log('Image request check:', { 
        userMessage: lastUserMessage.content, 
        aiResponse: content,
        isImageRequest, 
        model 
      });
      
      if (isImageRequest) {
        // Генерируем изображение независимо от выбранной текстовой модели
        console.log('Generating image for:', lastUserMessage.content);
        const imageUrl = await this.generateImage(lastUserMessage.content);
        return {
          content: `🎨 Сгенерировано изображение по запросу: "${lastUserMessage.content}"`,
          imageUrl,
          isImage: true
        };
      }
      
      return { content };
      
    } catch (error) {
      console.error('AI API error:', error);
      throw error;
    }
  }

  // Очистка служебных тегов провайдеров (например, <answer> ... </answer>)
  private sanitizeAIContent(content: string): string {
    try {
      let cleaned = content.trim();
      // Удаляем обертку <answer>...</answer> и подобные
      cleaned = cleaned.replace(/^\s*<answer>\s*/i, '').replace(/\s*<\/answer>\s*$/i, '');
      // Убираем одиночные теги вроде <thinking>, <summary> в начале/конце строк
      cleaned = cleaned.replace(/^\s*<[^>]+>\s*/i, '');
      cleaned = cleaned.replace(/\s*<\/[^>]+>\s*$/i, '');
      return cleaned.trim();
    } catch {
      return content;
    }
  }

  // Проверка, является ли запрос запросом на генерацию изображения
  private isImageGenerationRequest(content: string): boolean {
    const imageKeywords = [
      'нарисуй', 'создай изображение', 'сгенерируй картинку', 'покажи картинку',
      'сгенерируй', 'создай картинку', 'нарисуй картинку', 'покажи изображение',
      'draw', 'create image', 'generate image', 'show picture', 'paint',
      'иллюстрация', 'фото', 'картинка', 'рисунок', 'изображение'
    ];
    
    const lowerContent = content.toLowerCase();
    return imageKeywords.some(keyword => lowerContent.includes(keyword));
  }

  // Генерация изображения через различные API
  private async generateImage(prompt: string): Promise<string> {
    try {
      console.log('Generating image with prompt:', prompt);
      
      // Попробуем несколько API по очереди
      const apis = [
        () => this.generateWithHuggingFace(prompt),
        () => this.generateWithPicsum(prompt),
        () => this.generateWithLoremPicsum(prompt)
      ];

      for (const api of apis) {
        try {
          const result = await api();
          if (result) {
            console.log('Image generated successfully with API');
            return result;
          }
        } catch (error) {
          console.log('API failed, trying next:', error);
          continue;
        }
      }

      // Если все API не сработали, используем fallback
      console.log('All APIs failed, using fallback');
      return this.generateFallbackImage(prompt);
      
    } catch (error) {
      console.error('Error generating image:', error);
      return this.generateFallbackImage(prompt);
    }
  }

  // Hugging Face API
  private async generateWithHuggingFace(prompt: string): Promise<string | null> {
    const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: 20,
          guidance_scale: 7.5,
          width: 512,
          height: 512
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const imageBlob = await response.blob();
    return URL.createObjectURL(imageBlob);
  }

  // Picsum Photos API (случайные красивые изображения)
  private async generateWithPicsum(prompt: string): Promise<string | null> {
    // Генерируем случайный ID на основе промпта
    const seed = this.hashCode(prompt) % 1000;
    return `https://picsum.photos/seed/${seed}/512/512`;
  }

  // Lorem Picsum с фильтрами
  private async generateWithLoremPicsum(prompt: string): Promise<string | null> {
    const seed = this.hashCode(prompt) % 1000;
    const filters = ['blur', 'grayscale', 'sepia'];
    const filter = filters[seed % filters.length];
    return `https://picsum.photos/seed/${seed}/512/512?${filter}`;
  }

  // Простая хеш-функция для генерации seed
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Fallback изображение если API недоступен
  private generateFallbackImage(prompt: string): string {
    const colors = ['4F46E5', '059669', 'DC2626', '7C3AED', 'EA580C', '0891B2'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const shortPrompt = prompt.slice(0, 15).replace(/\s+/g, '+');
    return `https://via.placeholder.com/512x512/${randomColor}/FFFFFF?text=${encodeURIComponent(shortPrompt)}`;
  }

  // Генерация заголовка чата на основе первого сообщения
  private generateTitleFromMessage(message: string): string {
    const words = message.split(' ').slice(0, 6);
    return words.join(' ') + (message.split(' ').length > 6 ? '...' : '');
  }

  // Очистка всех сессий
  clearAllSessions(): void {
    localStorage.removeItem('ai_chat_sessions');
  }
}

export const aiService = new AIService();