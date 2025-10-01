import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIChat } from '@/components/ai-chat/AIChat';
import { useAuth } from '@/contexts/AuthContext';
import { aiService } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';

const AIChatPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClearAllChats = () => {
    if (window.confirm('Вы уверены, что хотите удалить все чаты? Это действие нельзя отменить.')) {
      aiService.clearAllSessions();
      toast({
        title: "Успешно",
        description: "Все чаты были удалены"
      });
      // Перезагружаем страницу для обновления состояния
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Без верхнего заголовка, всё управление в боковой панели */}
      <div className="h-screen">
        <AIChat />
      </div>
    </div>
  );
};

export default AIChatPage;