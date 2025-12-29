import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Plus, Zap, X, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTranslation } from '../constants/translations';

interface Props {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onNewChat: () => void;
  draftMessage?: string;
  editingMessageId?: string | null;
  onCancelEdit?: () => void;
  language: string;
}

const InputArea: React.FC<Props> = ({ onSendMessage, isLoading, onNewChat, draftMessage, editingMessageId, onCancelEdit, language }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = getTranslation(language);

  // Update input when draftMessage changes
  useEffect(() => {
    if (draftMessage !== undefined) {
      setInput(draftMessage);
      if (draftMessage && textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [draftMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  return (
    <div className="w-full pb-8 pt-4 px-4 bg-[var(--background)] border-t-2 border-[var(--border)] z-20">
      <div className="max-w-3xl mx-auto">
        <div className="relative">
            <motion.div 
                animate={{ 
                    y: isFocused || editingMessageId ? -22 : -12,
                    opacity: isFocused || editingMessageId ? 1 : 0.7 
                }}
                className="absolute left-4 px-1 bg-[var(--background)] z-10 flex items-center gap-2"
            >
                <span className={`text-[10px] font-mono-tech font-bold uppercase border border-[var(--border)] px-1 ${editingMessageId ? 'bg-yellow-400 text-black border-yellow-400' : ''}`}>
                    {editingMessageId ? t.editingMode : t.inputTerminal}
                </span>
                {editingMessageId && onCancelEdit && (
                    <button onClick={onCancelEdit} className="flex items-center gap-1 text-[10px] font-bold uppercase hover:underline text-red-500">
                        <X size={10} /> {t.cancel}
                    </button>
                )}
            </motion.div>

            <motion.div 
                animate={{
                    boxShadow: isFocused 
                        ? '8px 8px 0px 0px var(--shadow-color)' 
                        : '4px 4px 0px 0px var(--shadow-color)',
                    borderColor: editingMessageId ? '#facc15' : 'var(--border)'
                }}
                className="relative bg-[var(--background)] border-2 border-[var(--border)] transition-all"
            >
                <textarea
                    ref={textareaRef}
                    value={input}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isLoading ? t.inputBusy : (editingMessageId ? t.inputEditing : t.inputPlaceholder)}
                    disabled={isLoading}
                    rows={1}
                    className="w-full bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] px-4 py-4 pr-24 outline-none resize-none font-medium text-lg disabled:opacity-50"
                    style={{ minHeight: '60px' }}
                />

                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                    {!editingMessageId && (
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onNewChat}
                            className="p-2 bg-[var(--background)] text-[var(--foreground)] border-2 border-[var(--border)] hover:bg-[var(--muted)]"
                            title="New Session"
                        >
                            <Plus size={18} strokeWidth={3} />
                        </motion.button>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05, x: 1, y: 1, boxShadow: 'none' }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ boxShadow: '2px 2px 0px 0px var(--shadow-color)' }}
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`p-2 border-2 border-[var(--border)] ${editingMessageId ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-[var(--foreground)] text-[var(--background)]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {editingMessageId ? <Edit2 size={18} strokeWidth={3} /> : <ArrowUp size={18} strokeWidth={3} />}
                    </motion.button>
                </div>
            </motion.div>
        </div>
        
        <div className="flex justify-between items-center mt-2 px-1">
             <div className="flex items-center gap-2">
                 <motion.div 
                    animate={{ 
                        opacity: isLoading ? [1, 0.2, 1] : 1,
                        backgroundColor: isLoading ? 'var(--foreground)' : 'var(--foreground)'
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className={`w-2 h-2 border border-[var(--border)]`}
                 ></motion.div>
                 <span className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-mono-tech font-bold">
                    {isLoading ? t.processing : t.ready}
                 </span>
             </div>
             
             <div className="text-[10px] font-mono-tech font-bold text-[var(--muted-foreground)] uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                &copy; Copyright (c) 2025 <a href="https://github.com/zdev-aka/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--foreground)] hover:underline">ZDev</a>
             </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;