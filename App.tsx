import React, { useState, useEffect } from 'react';
import { Message, Settings, ChatSession, Artifact } from './types';
import { sendMessageToAI, executeTool } from './services/cerebrasService';
import MessageList from './components/MessageList';
import InputArea from './components/InputArea';
import SettingsModal from './components/SettingsModal';
import ArtifactViewer from './components/ArtifactViewer';
import { Menu, Plus, MessageSquare, Trash2, Settings as SettingsIcon, ChevronLeft, Moon, Sun, Library, FileText, Code } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { getTranslation } from './constants/translations';

const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_SETTINGS: Settings = {
  model: 'llama-3.3-70b',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  topK: 0,
  theme: 'light',
  language: 'en',
  provider: 'google', 
  customModelId: 'gemini-1.5-flash'
};

// --- BOOT SEQUENCE COMPONENT ---
const BootSequence = ({ onComplete }: { onComplete: () => void }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const steps = [
            setTimeout(() => setStep(1), 600),
            setTimeout(() => setStep(2), 1400),
            setTimeout(() => setStep(3), 2200),
            setTimeout(() => onComplete(), 3500),
        ];
        return () => steps.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <motion.div 
            key="boot-screen"
            className="fixed inset-0 z-[100] bg-black text-white font-mono flex flex-col items-center justify-center p-8 select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(15px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <div className="max-w-md w-full space-y-3">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between border-b border-white/20 pb-2 mb-6"
                >
                    <span className="font-bold tracking-widest">SYSTEM_BOOT_SEQUENCE</span>
                    <span className="text-green-500 font-bold">STATUS: OK</span>
                </motion.div>
                
                <div className="space-y-1">
                    {step >= 1 && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-blue-400">
                            {'>'} MOUNTING VIRTUAL_FILESYSTEM... <span className="text-white">[SUCCESS]</span>
                        </motion.div>
                    )}
                    {step >= 2 && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-blue-400">
                            {'>'} CONNECTING TO VELORCITY_AI_NODE... <span className="text-white">[ESTABLISHED]</span>
                        </motion.div>
                    )}
                    {step >= 3 && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-blue-400">
                            {'>'} LOADING NEURAL_INTERFACE_V2... <span className="text-white">[READY]</span>
                        </motion.div>
                    )}
                </div>

                <div className="mt-10 h-1 bg-white/5 w-full overflow-hidden rounded-full">
                   <motion.div 
                        className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3, ease: "easeInOut" }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [executingToolId, setExecutingToolId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string>("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [isArtifactsListOpen, setIsArtifactsListOpen] = useState(false);

  const t = getTranslation(settings.language);

  // Persistence
  useEffect(() => {
    const savedSettings = localStorage.getItem('cerebras_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsed }));
      document.documentElement.setAttribute('data-theme', parsed.theme);
    }
    const savedSessions = localStorage.getItem('cerebras_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
    }
    const savedArtifacts = localStorage.getItem('cerebras_artifacts');
    if (savedArtifacts) setArtifacts(JSON.parse(savedArtifacts));
  }, []);

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem('cerebras_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('cerebras_artifacts', JSON.stringify(artifacts));
  }, [artifacts]);

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('cerebras_settings', JSON.stringify(newSettings));
    document.documentElement.setAttribute('data-theme', newSettings.theme);
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    saveSettings({ ...settings, theme: newTheme });
  };

  const handleNewChat = () => {
    const newSession: ChatSession = { id: generateId(), title: 'New Conversation', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setDraftMessage("");
    setEditingMessageId(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
  };

  const processMessageTurn = async (sessionId: string, messages: Message[]) => {
    setIsLoading(true);
    try {
        const response = await sendMessageToAI(messages, settings);
        const botMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: response.content || "",
            timestamp: Date.now(),
            toolCalls: response.toolCalls?.map(tc => ({ state: 'call', toolCallId: tc.id, toolName: tc.name, args: tc.args }))
        };
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, botMsg], updatedAt: Date.now() } : s));
    } catch (error: any) {
        const errorMsg: Message = { id: generateId(), role: 'assistant', content: `Error: ${error.message}`, timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, errorMsg], updatedAt: Date.now() } : s));
    } finally {
        setIsLoading(false);
        setExecutingToolId(null);
    }
  };

  const handleSendMessage = async (content: string) => {
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
       const newSession: ChatSession = { id: generateId(), title: content.slice(0, 25) + '...', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
       setSessions(prev => [newSession, ...prev]);
       activeSessionId = newSession.id;
       setCurrentSessionId(activeSessionId);
    }

    if (editingMessageId && activeSessionId) {
        const session = sessions.find(s => s.id === activeSessionId);
        if (session) {
            const msgIndex = session.messages.findIndex(m => m.id === editingMessageId);
            if (msgIndex !== -1) {
                const truncatedMessages = session.messages.slice(0, msgIndex);
                const newUserMsg: Message = { id: editingMessageId, role: 'user', content, timestamp: Date.now() };
                setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...truncatedMessages, newUserMsg], updatedAt: Date.now() } : s));
                setEditingMessageId(null);
                setDraftMessage("");
                await processMessageTurn(activeSessionId, [...truncatedMessages, newUserMsg]);
                return;
            }
        }
    }

    const userMsg: Message = { id: generateId(), role: 'user', content, timestamp: Date.now() };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? content.slice(0, 25) + '...' : s.title, updatedAt: Date.now() } : s));
    
    const currentSession = sessions.find(s => s.id === activeSessionId);
    await processMessageTurn(activeSessionId!, currentSession ? [...currentSession.messages, userMsg] : [userMsg]);
  };

  const handleApproveTool = async (toolCallId: string, name: string, args: any) => {
      if (!currentSessionId) return;
      setExecutingToolId(toolCallId);
      try {
          let result;
          if (name === 'create_document') {
              const newArtifact: Artifact = { id: generateId(), title: args.title || 'Untitled', type: args.type || 'markdown', content: args.content || '', createdAt: Date.now(), updatedAt: Date.now() };
              setArtifacts(prev => [newArtifact, ...prev]);
              result = { isArtifact: true, artifactId: newArtifact.id, title: newArtifact.title, type: newArtifact.type, message: `Artifact created.` };
          } else if (name === 'update_document') {
              const target = artifacts.find(a => a.id === args.id);
              if (target) {
                  setArtifacts(prev => prev.map(a => a.id === args.id ? { ...target, content: args.content, updatedAt: Date.now() } : a));
                  setActiveArtifactId(target.id);
                  result = { isArtifact: true, artifactId: target.id, title: target.title, type: target.type, message: `Artifact updated.` };
              } else { result = { error: `Document not found.` }; }
          } else { result = await executeTool(name, args); }
          
          const toolMsg: Message = { id: toolCallId, role: 'tool', content: JSON.stringify(result), timestamp: Date.now() };
          setSessions(prev => prev.map(s => {
              if (s.id === currentSessionId) {
                  const updatedMessages = s.messages.map(msg => msg.toolCalls ? { ...msg, toolCalls: msg.toolCalls.map(tc => tc.toolCallId === toolCallId ? { ...tc, state: 'result' as const, result } : tc) } : msg);
                  return { ...s, messages: [...updatedMessages, toolMsg] };
              }
              return s;
          }));
          const currentSession = sessions.find(s => s.id === currentSessionId);
          if (currentSession) await processMessageTurn(currentSessionId, [...currentSession.messages, toolMsg]);
      } catch (err) { console.error(err); setExecutingToolId(null); }
  };

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];
  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || null;

  return (
    <MotionConfig reducedMotion="never">
      <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans">
        
        <AnimatePresence mode="wait" initial={true}>
          {isBooting && <BootSequence key="boot-component" onComplete={() => setIsBooting(false)} />}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {isSidebarOpen && !isBooting && (
            <motion.aside
              key="sidebar"
              initial={{ x: -300, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="h-full bg-[var(--background)] border-r-2 border-[var(--border)] flex flex-col flex-shrink-0 z-20 w-[280px]"
            >
              <div className="p-4 border-b-2 border-[var(--border)] flex justify-between items-center bg-[var(--muted)]">
                <span className="font-black text-xl tracking-tighter uppercase">{t.history}</span>
                <button onClick={() => setIsSidebarOpen(false)} className="hover:bg-[var(--border)] hover:text-[var(--background)] p-1 transition-colors"><ChevronLeft size={20} /></button>
              </div>
              <div className="p-4 space-y-2">
                  <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--background)] border-2 border-[var(--foreground)] shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase font-bold text-xs"><Plus size={16} /> {t.newChat}</button>
                  <button onClick={() => setIsArtifactsListOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--muted)] border-2 border-[var(--border)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all uppercase font-bold text-xs"><Library size={16} /> {t.artifacts} ({artifacts.length})</button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4 scrollbar-hide">
                 {sessions.map(session => (
                     <motion.div 
                      layout
                      key={session.id} 
                      onClick={() => { setCurrentSessionId(session.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                      className={`group relative p-3 border-2 cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-neo-sm' : 'bg-[var(--background)] border-[var(--border)] hover:bg-[var(--muted)]'}`}
                     >
                         <div className="flex items-center gap-3"><MessageSquare size={14} /><span className="text-xs font-bold truncate flex-1 uppercase font-mono">{session.title}</span></div>
                         <button onClick={(e) => deleteSession(e, session.id)} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-red-500 transition-opacity ${currentSessionId === session.id ? 'text-[var(--background)]' : 'opacity-0 group-hover:opacity-100'}`}><Trash2 size={12} /></button>
                     </motion.div>
                 ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col relative min-w-0 bg-[var(--background)]">
          <header className="h-16 flex items-center px-4 justify-between border-b-2 border-[var(--border)]">
            <div className="flex items-center gap-4">
                {!isSidebarOpen && (
                  <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setIsSidebarOpen(true)} className="p-2 border-2 border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
                    <Menu size={20} />
                  </motion.button>
                )}
                <span className="font-bold text-lg hidden sm:block uppercase tracking-tight">{sessions.find(s => s.id === currentSessionId)?.title || t.untitled}</span>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={toggleTheme} className="p-2 border-2 border-[var(--border)] hover:bg-[var(--muted)] transition-all">{settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
               <button onClick={() => setIsSettingsOpen(true)} className="p-2 border-2 border-[var(--border)] hover:bg-[var(--muted)] transition-all"><SettingsIcon size={18} /></button>
            </div>
          </header>

          <MessageList messages={currentMessages} isLoading={isLoading} onApproveTool={handleApproveTool} executingToolId={executingToolId} onOpenArtifact={setActiveArtifactId} onEditMessage={(id, content) => { setDraftMessage(content); setEditingMessageId(id); }} language={settings.language} />
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} onNewChat={handleNewChat} draftMessage={draftMessage} editingMessageId={editingMessageId} onCancelEdit={() => { setDraftMessage(""); setEditingMessageId(null); }} language={settings.language} />
          <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={saveSettings} />

          <AnimatePresence>
              {isArtifactsListOpen && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsArtifactsListOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={(e) => e.stopPropagation()} className="bg-[var(--background)] border-4 border-[var(--border)] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-neo">
                          <div className="p-4 border-b-2 border-[var(--border)] flex justify-between items-center bg-[var(--muted)]">
                              <h2 className="font-black uppercase text-lg tracking-tighter">{t.artifacts}</h2>
                              <button onClick={() => setIsArtifactsListOpen(false)} className="p-1 hover:bg-[var(--border)] transition-colors"><ChevronLeft size={24} /></button>
                          </div>
                          <div className="p-4 overflow-y-auto flex-1 space-y-2">
                              {artifacts.length === 0 ? <div className="text-center py-12 font-mono text-sm opacity-50 tracking-widest">DATA_EMPTY: NO_ARTIFACTS_FOUND</div> : 
                                  artifacts.map(art => (
                                      <motion.div whileHover={{ x: 5 }} key={art.id} onClick={() => { setActiveArtifactId(art.id); setIsArtifactsListOpen(false); }} className="flex items-center gap-4 p-3 border-2 border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer transition-colors">
                                          <div className="p-2 bg-[var(--background)] border border-[var(--border)]">{art.type === 'code' ? <Code size={16} /> : <FileText size={16} />}</div>
                                          <div className="flex-1 min-w-0"><h3 className="font-bold truncate uppercase text-sm">{art.title}</h3><p className="text-[10px] font-mono opacity-50">{new Date(art.updatedAt).toLocaleDateString()}</p></div>
                                      </motion.div>
                                  ))
                              }
                          </div>
                      </motion.div>
                  </motion.div>
              )}
          </AnimatePresence>

          <ArtifactViewer isOpen={!!activeArtifactId} onClose={() => setActiveArtifactId(null)} artifact={activeArtifact} onUpdate={(id, content) => setArtifacts(prev => prev.map(a => a.id === id ? { ...a, content, updatedAt: Date.now() } : a))} language={settings.language} />
        </main>
      </div>
    </MotionConfig>
  );
};

export default App;