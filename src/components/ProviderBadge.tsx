import React, { useState } from 'react';
import { Cpu, ChevronDown, Sparkles } from 'lucide-react';
import { useProviderConfig } from '../hooks/useProviderConfig';
import { ProviderModelModal } from './ProviderModelModal';
import { LlmProviderId } from '../types/provider';

interface ProviderBadgeProps {
  compact?: boolean;
  className?: string;
  onProviderChange?: (provider: LlmProviderId, model: string) => void;
}

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({
  compact = false,
  className = '',
  onProviderChange
}) => {
  const { activeProvider, activeModel, currentProviderObj } = useProviderConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getProviderTheme = (id: LlmProviderId) => {
    switch (id) {
      case 'claude':
        return {
          pill: 'bg-amber-950/80 text-amber-300 border-amber-600/60 hover:border-amber-400',
          dot: 'bg-amber-400',
          short: 'Claude'
        };
      case 'openai':
        return {
          pill: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 hover:border-emerald-400',
          dot: 'bg-emerald-400',
          short: 'OpenAI'
        };
      case 'deepseek':
        return {
          pill: 'bg-blue-950/80 text-blue-300 border-blue-600/60 hover:border-blue-400',
          dot: 'bg-blue-400',
          short: 'DeepSeek'
        };
      case 'groq':
        return {
          pill: 'bg-orange-950/80 text-orange-300 border-orange-600/60 hover:border-orange-400',
          dot: 'bg-orange-400',
          short: 'Groq'
        };
      case 'gemini':
      default:
        return {
          pill: 'bg-purple-950/80 text-purple-300 border-purple-600/60 hover:border-purple-400',
          dot: 'bg-purple-400',
          short: 'Gemini'
        };
    }
  };

  const theme = getProviderTheme(activeProvider);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-mono font-medium border transition-all cursor-pointer shadow-xs ${theme.pill} ${className}`}
        title={`Active AI Provider: ${currentProviderObj.name} (${activeModel}). Click to switch providers.`}
      >
        <span className={`w-2 h-2 rounded-full ${theme.dot} animate-pulse`} />
        {compact ? (
          <span>{theme.short}</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="font-bold">{theme.short}:</span>
            <span className="text-[11px] text-stone-300 truncate max-w-[120px]">{activeModel.replace('claude-3-', '').replace('gemini-', '')}</span>
          </div>
        )}
        <ChevronDown className="w-3 h-3 text-stone-400 opacity-70 group-hover:opacity-100" />
      </button>

      <ProviderModelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProviderChanged={onProviderChange}
      />
    </>
  );
};
