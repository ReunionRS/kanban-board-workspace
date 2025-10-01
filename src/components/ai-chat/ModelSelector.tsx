import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot } from 'lucide-react';
import { AIModel } from '@/services/aiService';

interface ModelSelectorProps {
  currentModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

export const ModelSelector = ({ currentModel, onModelChange }: ModelSelectorProps) => {
  const models = [
    {
      id: 'qwen' as AIModel,
      name: 'QWEN 2.5',
      description: 'Текстовая модель (Qwen)',
      icon: Bot
    },
    {
      id: 'nvidia' as AIModel,
      name: 'NVIDIA Nemotron',
      description: 'Текстовая модель (Nemotron)',
      icon: Bot
    },
    {
      id: 'tencent' as AIModel,
      name: 'Tencent Hunyuan',
      description: 'Текстовая модель (бесплатно)',
      icon: Bot
    }
  ];

  const currentModelData = models.find(m => m.id === currentModel);

  return (
    <Select value={currentModel} onValueChange={onModelChange}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          <span className="truncate">{currentModelData?.name || 'Выберите модель'}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
        {models.map((model) => {
          return (
            <SelectItem 
              key={model.id} 
              value={model.id} 
              className="hover:bg-gray-50 focus:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Bot className="w-4 h-4" />
                <div>
                  <div className="font-medium">{model.name}</div>
                  <div className="text-xs text-muted-foreground">{model.description}</div>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
