import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, Plus, MessageSquare, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { aiService, ChatMessage, ChatSession, AIModel } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';
import { ImageViewer } from './ImageViewer';
import { ModelSelector } from './ModelSelector';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Сообщение с подсветкой и кнопкой копирования для блоков кода
function MessageWithMarkdown({ content, isUser }: { content: string; isUser: boolean }) {
  // Простейший рендер: разбиваем по тройным бэктикам ```
  const parts = content.split(/```/);
  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {
      // noop
    }
  };

  if (parts.length === 1) {
    // Полный Markdown через marked + Prism для inline-кода тоже
    const html = marked.parse(content, { breaks: true }) as string;
    return (
      <div
        className={`prose prose-sm max-w-none max-w-full break-words whitespace-pre-wrap overflow-hidden ${isUser ? 'prose-invert' : ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
        onMouseEnter={() => Prism.highlightAll()}
      />
    );
  }

  return (
    <div className="space-y-3">
      {parts.map((block, idx) => {
        // Чередуем: четные индексы — текст, нечетные — код
        const isCode = idx % 2 === 1;
        if (!isCode) {
          // Полный Markdown для текстовой части
          const html = marked.parse(block, { breaks: true }) as string;
          return (
            <div
              key={idx}
              className={`prose prose-sm max-w-none max-w-full break-words whitespace-pre-wrap overflow-hidden ${isUser ? 'prose-invert' : ''}`}
              dangerouslySetInnerHTML={{ __html: html }}
              onMouseEnter={() => Prism.highlightAll()}
            />
          );
        }
        // Возможен язык в первой строке: "ts\n...code" — отделим
        const firstLineBreak = block.indexOf('\n');
        const lang = firstLineBreak > -1 ? block.slice(0, firstLineBreak).trim() : '';
        const code = firstLineBreak > -1 ? block.slice(firstLineBreak + 1) : block;
        return (
          <div key={idx} className="group rounded-md overflow-hidden bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/80">
              <span className="text-xs text-muted-foreground truncate">{lang || 'code'}</span>
              <button
                className="text-xs px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-800"
                onClick={() => handleCopy(code)}
              >
                Скопировать
              </button>
            </div>
            <pre className="p-3 text-sm leading-relaxed break-all whitespace-pre-wrap"><code>{code}</code></pre>
          </div>
        );
      })}
    </div>
  );
}

interface AIChatProps {
  className?: string;
}

export const AIChat = ({ className }: AIChatProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const [currentModel, setCurrentModel] = useState<AIModel>('qwen');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentSession = sessions.find(session => session.id === currentSessionId);

  useEffect(() => {
    loadSessions();
  }, []);

  // Ensure Prism is available globally, then lazy-load language components to avoid ESM timing issues
  useEffect(() => {
    // @ts-ignore
    (window as any).Prism = Prism;
    (async () => {
      try {
        await Promise.all([
          import('prismjs/components/prism-markup'),
          import('prismjs/components/prism-javascript'),
          import('prismjs/components/prism-typescript'),
          import('prismjs/components/prism-tsx'),
          import('prismjs/components/prism-json'),
          import('prismjs/components/prism-css')
        ]);
        Prism.highlightAll();
      } catch (e) {
        console.warn('Prism languages load failed', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (currentSession?.messages.length) {
      scrollToBottom();
      // Re-highlight when messages change
      try { Prism.highlightAll(); } catch { }
    }
  }, [currentSession?.messages]);

  const loadSessions = () => {
    const loadedSessions = aiService.getAllSessions();
    setSessions(loadedSessions);

    if (loadedSessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(loadedSessions[0].id);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }
    }, 100);
  };

  const createNewSession = () => {
    const newSession = aiService.createSession();
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessage('');
    setIsMobileMenuOpen(false);
  };

  const deleteSession = (sessionId: string) => {
    aiService.deleteSession(sessionId);
    setSessions(prev => prev.filter(session => session.id !== sessionId));

    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(session => session.id !== sessionId);
      setCurrentSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentSessionId || isLoading) return;

    const messageText = message.trim();
    setMessage('');
    setIsLoading(true);
    setTypingMessage('');

    // Сразу обновляем локальное состояние для отображения сообщения пользователя
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: messageText,
      timestamp: new Date()
    };

    setSessions(prev => prev.map(session =>
      session.id === currentSessionId
        ? { ...session, messages: [...session.messages, userMessage] }
        : session
    ));

    try {
      // Анимация печати
      const typingInterval = setInterval(() => {
        setTypingMessage(prev => {
          const dots = prev.split('.').length - 1;
          return 'ИИ печатает' + '.'.repeat((dots + 1) % 4);
        });
      }, 500);

      await aiService.sendMessage(currentSessionId, messageText, currentModel);
      clearInterval(typingInterval);
      setTypingMessage('');
      loadSessions(); // Перезагружаем сессии для обновления
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось отправить сообщение",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setTypingMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={`flex h-full ai-chat-container ${className}`}>
      {/* Боковая панель с сессиями */}
      <div className={`
        ai-chat-sidebar flex flex-col
        ${isMobileMenuOpen ? 'open' : ''}
      `}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = '/dashboard')}
                className="flex items-center gap-2"
              >
                <span className="hidden sm:inline">Назад к доскам</span>
                <span className="sm:hidden">Назад</span>
              </Button>
            </div>
            <Button
              onClick={toggleMobileMenu}
              size="sm"
              variant="ghost"
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold">Чаты с ИИ</h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`
                  cursor-pointer transition-all duration-200 hover:scale-[1.02]
                  ${currentSessionId === session.id
                    ? 'bg-primary/10 border-primary shadow-md'
                    : 'hover:bg-muted/50 hover:shadow-sm'
                  }
                `}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  setIsMobileMenuOpen(false);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{session.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.messages.length} сообщений
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(session.updatedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Нижняя панель действий: внизу слева у меню */}
        <div className="p-3 border-t mt-auto">
          <div className="flex items-center gap-2">
            <Button onClick={createNewSession} size="sm" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Новый чат
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Удалить все чаты?')) {
                  aiService.clearAllSessions();
                  window.location.reload();
                }
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Мобильный оверлей */}
      {isMobileMenuOpen && (
        <div
          className="mobile-overlay fixed inset-0 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Основная область чата */}
      <div className="ai-chat-main flex-1 flex flex-col min-w-0">
        {currentSession ? (
          <>
            {/* Заголовок убран, оставим только селектор модели сверху справа для десктопа */}
            <div className="p-3 border-b bg-background flex items-center justify-between">
              <Button
                onClick={toggleMobileMenu}
                size="sm"
                variant="ghost"
                className="lg:hidden"
              >
                <Menu className="w-4 h-4" />
              </Button>
              <div className="ml-auto">
                <ModelSelector
                  currentModel={currentModel}
                  onModelChange={setCurrentModel}
                />
              </div>
            </div>

            {/* Область сообщений */}
            <ScrollArea ref={scrollAreaRef} className="flex-1">
              <div className="px-0 py-4">
                <div className="space-y-4 w-full">
                  {currentSession.messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                      <h3 className="text-lg font-medium mb-2">Начните новый диалог</h3>
                      <p className="text-muted-foreground">
                        Задайте вопрос ИИ-агенту и получите помощь
                      </p>
                    </div>
                  ) : (
                    currentSession.messages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`
                        flex w-full gap-3 animate-in slide-in-from-bottom-4 duration-500
                        ${msg.role === 'user' ? 'justify-end' : 'justify-start'}
                      `}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {msg.role === 'assistant' && (
                          <div className="relative w-8 h-8 shrink-0">
                            <Avatar className="w-8 h-8 animate-in fade-in duration-300 absolute bottom-0 right-0 translate-x-2">
                              <AvatarFallback className="bg-primary/10">
                                <Bot className="w-4 h-4 text-primary" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}

                         <div
                           className={`
                           w-full max-w-full rounded-lg px-3 py-2 animate-in slide-in-from-bottom-2 duration-300
                           break-words whitespace-pre-wrap min-w-0 overflow-hidden
                           ${msg.role === 'user'
                               ? 'bg-primary text-primary-foreground ml-auto'
                               : 'bg-muted'
                             }
                         `}
                         >
                          {/* Текст сообщения с поддержкой Markdown-lite и блоков кода */}
                          <MessageWithMarkdown content={msg.content} isUser={msg.role === 'user'} />

                          {/* Отображение изображения */}
                          {msg.isImage && msg.imageUrl && (
                            <div className="mt-3">
                              <ImageViewer
                                imageUrl={msg.imageUrl}
                                alt="Сгенерированное изображение"
                              />
                            </div>
                          )}

                          <p className="text-xs opacity-70 mt-1">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>

                        {msg.role === 'user' && (
                          <div className="relative w-8 h-8 shrink-0">
                            <Avatar className="w-8 h-8 animate-in fade-in duration-300 absolute bottom-0 left-0 -translate-x-2">
                              <AvatarFallback className="bg-secondary">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* Анимация загрузки */}
                  {(isLoading || typingMessage) && (
                    <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-4 duration-300">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="w-4 h-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          {typingMessage ? (
                            <span className="text-sm text-muted-foreground">{typingMessage}</span>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Поле ввода */}
             <div className="p-2 border-t bg-background sticky bottom-0">
                 <div className="flex gap-2 w-full px-0">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите ваше сообщение..."
                  disabled={isLoading}
                  className="flex-1 min-w-0"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium mb-2">Выберите чат</h3>
              <p className="text-muted-foreground mb-4">
                Выберите существующий чат или создайте новый
              </p>
              <Button onClick={createNewSession}>
                <Plus className="w-4 h-4 mr-2" />
                Создать новый чат
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};