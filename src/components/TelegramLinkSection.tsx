import { useState } from 'react';
import { MessageCircle, Link2, Unlink, Check, Copy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface TelegramLinkSectionProps {
  telegramUsername: string;
  telegramLinked: boolean;
  telegramChatId?: string;
  onUpdate: (data: any) => void;
}

export const TelegramLinkSection = ({ 
  telegramUsername, 
  telegramLinked, 
  telegramChatId,
  onUpdate 
}: TelegramLinkSectionProps) => {
  const [username, setUsername] = useState(telegramUsername || '');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkingStep, setLinkingStep] = useState<'input' | 'waiting' | 'confirming' | 'linked'>('input');
  const [error, setError] = useState<string | null>(null);

  const handleStartLinking = async () => {
    if (!username.trim()) {
      setError('Введите ваш Telegram username');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;
      await onUpdate({ 
        telegramUsername: formattedUsername,
        telegramLinked: false 
      });

      setLinkingStep('waiting');
    } catch (error) {
      setError('Ошибка при сохранении username');
      setIsLinking(false);
    }
  };

  const handleConfirmLinking = async () => {
    if (!confirmationCode.trim()) {
      setError('Введите код подтверждения');
      return;
    }

    try {
      await onUpdate({ 
        telegramLinked: true,
        telegramChatId: 'demo_chat_id'
      });

      setLinkingStep('linked');
      setConfirmationCode('');
      setError(null);
    } catch (error) {
      setError('Неверный код подтверждения');
    }
  };

  const handleUnlink = async () => {
    try {
      await onUpdate({ 
        telegramUsername: null,
        telegramLinked: false,
        telegramChatId: null
      });
      
      setLinkingStep('input');
      setUsername('');
      setConfirmationCode('');
      setError(null);
    } catch (error) {
      setError('Ошибка при отключении Telegram');
    }
  };

  const copyBotLink = () => {
    navigator.clipboard.writeText('https://t.me/KaanBaanBot');
  };

  const getBotInstructions = () => {
    const formattedUsername = username.startsWith('@') ? username : `@${username}`;
    
    return `
Для связывания аккаунта:

1. Перейдите к боту: https://t.me/KaanBaanBot 
2. Нажмите "Start" или отправьте /start
3. Отправьте команду /link
4. Введите код подтверждения, который покажет бот
5. Вернитесь сюда и введите код в поле ниже
    `.trim();
  };

  if (telegramLinked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Telegram уведомления
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" />
              Подключено
            </Badge>
          </CardTitle>
          <CardDescription>
            Ваш аккаунт успешно связан с Telegram ботом
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Связанный аккаунт</span>
            </div>
            <p className="text-sm text-green-700">
              <strong>Username:</strong> {telegramUsername}
            </p>
            {telegramChatId && (
              <p className="text-sm text-green-700">
                <strong>Chat ID:</strong> {telegramChatId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Вы будете получать уведомления о:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Новых задачах вашей профессии</li>
              <li>• Приближающихся дедлайнах (за 5, 3 дня и в день срока)</li>
              <li>• Изменениях статуса задач</li>
              <li>• Назначении задач на вас</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={copyBotLink} className="gap-2">
              <Copy className="w-4 h-4" />
              Ссылка на бота
            </Button>
            <Button variant="outline" onClick={handleUnlink} className="gap-2 text-red-600 hover:text-red-700">
              <Unlink className="w-4 h-4" />
              Отключить
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Telegram уведомления
          <Badge variant="outline">Не подключено</Badge>
        </CardTitle>
        <CardDescription>
          Получайте уведомления о задачах и дедлайнах в Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {linkingStep === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram-username">Telegram Username</Label>
              <Input
                id="telegram-username"
                placeholder="@your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLinking}
              />
              <p className="text-xs text-gray-500">
                Ваш username можно найти в настройках Telegram
              </p>
            </div>

            <Button onClick={handleStartLinking} disabled={isLinking} className="gap-2">
              <Link2 className="w-4 h-4" />
              {isLinking ? 'Сохранение...' : 'Начать связывание'}
            </Button>
          </div>
        )}

        {linkingStep === 'waiting' && (
          <div className="space-y-4">
            <Alert>
              <MessageCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Теперь перейдите к Telegram боту:</p>
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                    {getBotInstructions()}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={copyBotLink} variant="outline" className="gap-2">
                <Copy className="w-4 h-4" />
                Скопировать ссылку на бота
              </Button>
              <Button onClick={() => setLinkingStep('confirming')} className="gap-2">
                Ввести код подтверждения
              </Button>
            </div>
          </div>
        )}

        {linkingStep === 'confirming' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirmation-code">Код подтверждения</Label>
              <Input
                id="confirmation-code"
                placeholder="Введите код из Telegram бота"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <p className="text-xs text-gray-500">
                Код состоит из 6 символов и действителен 10 минут
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setLinkingStep('waiting')} variant="outline">
                Назад
              </Button>
              <Button onClick={handleConfirmLinking} className="gap-2">
                <Check className="w-4 h-4" />
                Подтвердить связывание
              </Button>
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Преимущества подключения:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Мгновенные уведомления о новых задачах</li>
            <li>• Напоминания о дедлайнах</li>
            <li>• Просмотр задач прямо в Telegram</li>
            <li>• Быстрое обновление статуса задач</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};