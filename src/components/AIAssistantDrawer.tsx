import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  RefreshCw,
  HelpCircle,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useCampaigns } from '../context/CampaignContext';
import { sendChatMessage } from '../services/ai/client';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  'Which campaign has the highest CTR?',
  'Why might my conversion rate be low?',
  'Compare my campaigns by ROAS',
  'What should I improve first?',
  'Summarize my campaign performance',
];

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const { campaigns, selectedCampaignId, chatMessages, addChatMessage, clearChatHistory, aiStatus } = useCampaigns();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chatMessages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    addChatMessage(text, 'user');
    setInputText('');
    setIsLoading(true);

    try {
      const updatedMessages = [...chatMessages, { id: 'temp', sender: 'user' as const, text, timestamp: new Date().toISOString() }];
      const { reply, usedFallback } = await sendChatMessage(
        updatedMessages,
        campaigns,
        selectedCampaignId || undefined
      );

      addChatMessage(reply, 'assistant', false);
    } catch (err: any) {
      addChatMessage(
        'Sorry, I encountered an issue communicating with the AI service. Please check your network and try again.',
        'assistant',
        true
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl border-l border-slate-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Marketing Assistant</h3>
                <span className="rounded-full bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                  {aiStatus.aiConfigured ? 'Gemini 3.8 Flash' : 'Analytical Fallback'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Grounded in {campaigns.length} active campaigns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChatHistory}
              title="Clear conversation"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Campaign Grounding Context Banner */}
        <div className="flex items-center justify-between bg-indigo-50/70 border-b border-indigo-100 px-4 py-2 text-[11px] text-indigo-800">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-indigo-600" />
            <span>Active context: <strong>{campaigns.length} campaigns</strong></span>
          </div>
          <span className="text-[10px] text-indigo-600 font-mono">Real math & metrics</span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : msg.isError
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-xs'
                      : 'bg-slate-100 text-slate-800 border border-slate-200/60 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <div
                    className={`mt-1 text-[9px] ${
                      isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 rounded-2xl px-3.5 py-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-500 ml-1">Analyzing campaign data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="border-t border-slate-100 bg-slate-50/70 p-3">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>Suggested Inquiries</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 p-3 bg-white">
          <div className="relative flex items-end rounded-xl border border-slate-200 bg-slate-50 focus-within:border-indigo-500 focus-within:bg-white transition-colors">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about CTR, ROAS, conversions, or bottlenecks..."
              className="w-full resize-none bg-transparent px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              className="m-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-slate-400">
            Responses calculated from current campaign data. Press Enter to send.
          </p>
        </div>
      </div>
    </div>
  );
};
