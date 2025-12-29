import React from 'react';
import { Settings, AVAILABLE_MODELS } from '../types';
import { X, Cpu, Thermometer, Zap, Activity, Layers, Key, Globe, Database, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslation, SUPPORTED_LANGUAGES } from '../constants/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Settings) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = React.useState<Settings>(settings);
  const t = getTranslation(localSettings.language);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleChange = (key: keyof Settings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const btnAnim = {
    rest: { x: 0, y: 0, boxShadow: '4px 4px 0px 0px var(--shadow-color)' },
    hover: { x: 2, y: 2, boxShadow: '2px 2px 0px 0px var(--shadow-color)' },
    tap: { x: 4, y: 4, boxShadow: '0px 0px 0px 0px var(--shadow-color)' },
    active: { x: 4, y: 4, boxShadow: '0px 0px 0px 0px var(--shadow-color)' }
  };

  const isCustom = localSettings.model === 'custom';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--foreground)]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--background)] border-4 border-[var(--border)] shadow-[8px_8px_0px_0px_var(--shadow-color)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 flex justify-between items-center border-b-4 border-[var(--border)] shrink-0">
                <h2 className="text-2xl md:text-3xl font-serif font-black text-[var(--foreground)] uppercase tracking-tighter">{t.settings}</h2>
                <button onClick={onClose} className="text-[var(--foreground)] hover:rotate-90 transition-transform">
                  <X size={32} strokeWidth={3} />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8">
                
                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-mono-tech font-bold text-[var(--foreground)] mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Languages size={18} strokeWidth={2.5} /> {t.interfaceLang}
                  </label>
                  <select 
                      value={localSettings.language} 
                      onChange={(e) => handleChange('language', e.target.value)}
                      className="w-full bg-[var(--background)] border-2 border-[var(--border)] p-3 font-mono text-sm outline-none"
                  >
                      {SUPPORTED_LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                  </select>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-mono-tech font-bold text-[var(--foreground)] mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Cpu size={18} strokeWidth={2.5} /> {t.modelArch}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {AVAILABLE_MODELS.map((model) => {
                      const isActive = localSettings.model === model.id;
                      return (
                        <motion.button
                          key={model.id}
                          variants={btnAnim}
                          initial={isActive ? "active" : "rest"}
                          animate={isActive ? "active" : "rest"}
                          whileHover={isActive ? "active" : "hover"}
                          whileTap="tap"
                          transition={{ duration: 0.1, ease: 'linear' }}
                          onClick={() => handleChange('model', model.id)}
                          className={`px-3 py-3 text-left border-2 flex flex-col justify-center gap-1 ${
                            isActive
                              ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--border)]'
                              : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                              <span className="font-bold font-mono-tech text-sm uppercase truncate pr-2">{model.name}</span>
                              {isActive && <div className="w-2 h-2 shrink-0 bg-[var(--background)]" />}
                          </div>
                          
                          {/* Label/Badge */}
                          <span className={`text-[9px] font-mono-tech uppercase tracking-widest px-1.5 py-0.5 w-fit border ${
                              isActive 
                              ? 'border-[var(--background)] text-[var(--background)] opacity-80' 
                              : 'border-[var(--foreground)] text-[var(--foreground)] opacity-60'
                          }`}>
                              {model.provider}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Provider Settings */}
                <AnimatePresence>
                    {isCustom && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-4 border-2 border-dashed border-[var(--border)] p-4 bg-[var(--muted)]"
                        >
                            <div className="flex items-center gap-2 text-sm font-bold uppercase mb-2">
                                <Database size={16} /> {t.extProvider}
                            </div>
                            
                            {/* Provider Select */}
                            <div>
                                <label className="block text-xs font-mono-tech font-bold mb-1">{t.provider}</label>
                                <select 
                                    value={localSettings.provider || 'google'} 
                                    onChange={(e) => handleChange('provider', e.target.value)}
                                    className="w-full bg-[var(--background)] border-2 border-[var(--border)] p-2 font-mono text-sm outline-none"
                                >
                                    <option value="google">Google GenAI (Gemini)</option>
                                    <option value="openai" disabled>OpenAI (Coming Soon)</option>
                                    <option value="cerebras" disabled>Cerebras (Native)</option>
                                </select>
                            </div>

                            {/* API Key */}
                            <div>
                                <label className="block text-xs font-mono-tech font-bold mb-1">{t.apiKey}</label>
                                <div className="flex items-center gap-2 bg-[var(--background)] border-2 border-[var(--border)] px-2">
                                    <Key size={14} className="shrink-0" />
                                    <input 
                                        type="password"
                                        placeholder="sk-..."
                                        value={localSettings.customApiKey || ''}
                                        onChange={(e) => handleChange('customApiKey', e.target.value)}
                                        className="w-full bg-transparent p-2 font-mono text-sm outline-none"
                                    />
                                </div>
                            </div>

                             {/* Custom Model ID */}
                             <div>
                                <label className="block text-xs font-mono-tech font-bold mb-1">{t.targetModel}</label>
                                <div className="flex items-center gap-2 bg-[var(--background)] border-2 border-[var(--border)] px-2">
                                    <Globe size={14} className="shrink-0" />
                                    <input 
                                        type="text"
                                        placeholder="e.g. gemini-1.5-flash"
                                        value={localSettings.customModelId || 'gemini-1.5-flash'}
                                        onChange={(e) => handleChange('customModelId', e.target.value)}
                                        className="w-full bg-transparent p-2 font-mono text-sm outline-none"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Temperature */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-mono-tech font-bold text-[var(--foreground)] flex items-center gap-2 uppercase tracking-wider">
                            <Thermometer size={18} strokeWidth={2.5} /> {t.temp}
                            </label>
                            <span className="font-mono-tech font-bold bg-[var(--muted)] px-2 border border-[var(--border)]">{localSettings.temperature}</span>
                        </div>
                        <div className="relative h-6 bg-[var(--muted)] border-2 border-[var(--border)] shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                            <input
                            type="range"
                            min="0"
                            max="1.5"
                            step="0.1"
                            value={localSettings.temperature}
                            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div 
                                className="h-full bg-[var(--foreground)]" 
                                style={{ width: `${(localSettings.temperature / 1.5) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                         <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-mono-tech font-bold text-[var(--foreground)] flex items-center gap-2 uppercase tracking-wider">
                            <Activity size={18} strokeWidth={2.5} /> {t.maxTokens}
                            </label>
                            <span className="font-mono-tech font-bold bg-[var(--muted)] px-2 border border-[var(--border)]">{localSettings.maxTokens}</span>
                        </div>
                        <div className="relative h-6 bg-[var(--muted)] border-2 border-[var(--border)] shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                            <input
                            type="range"
                            min="100"
                            max="8192"
                            step="100"
                            value={localSettings.maxTokens}
                            onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div 
                                className="h-full bg-[var(--foreground)]" 
                                style={{ width: `${(localSettings.maxTokens / 8192) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Top P */}
                    <div>
                         <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-mono-tech font-bold text-[var(--foreground)] flex items-center gap-2 uppercase tracking-wider">
                            <Layers size={18} strokeWidth={2.5} /> {t.topP}
                            </label>
                            <span className="font-mono-tech font-bold bg-[var(--muted)] px-2 border border-[var(--border)]">{localSettings.topP}</span>
                        </div>
                        <div className="relative h-6 bg-[var(--muted)] border-2 border-[var(--border)] shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                            <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={localSettings.topP}
                            onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div 
                                className="h-full bg-[var(--foreground)]" 
                                style={{ width: `${localSettings.topP * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Top K */}
                    <div>
                         <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-mono-tech font-bold text-[var(--foreground)] flex items-center gap-2 uppercase tracking-wider">
                            <Zap size={18} strokeWidth={2.5} /> {t.topK}
                            </label>
                            <span className="font-mono-tech font-bold bg-[var(--muted)] px-2 border border-[var(--border)]">{localSettings.topK}</span>
                        </div>
                        <div className="relative h-6 bg-[var(--muted)] border-2 border-[var(--border)] shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                            <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={localSettings.topK}
                            onChange={(e) => handleChange('topK', parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div 
                                className="h-full bg-[var(--foreground)]" 
                                style={{ width: `${(localSettings.topK / 100) * 100}%` }}
                            />
                        </div>
                        <div className="text-[10px] font-mono-tech text-[var(--muted-foreground)] mt-1 text-right">0 = Disabled</div>
                    </div>
                </div>

              </div>
              
               <div className="p-6 md:p-8 border-t-4 border-[var(--border)] bg-[var(--background)] shrink-0">
                  <motion.button
                    variants={btnAnim}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    transition={{ duration: 0.1, ease: 'linear' }}
                    onClick={handleSave}
                    className="w-full bg-[var(--foreground)] text-[var(--background)] border-2 border-[var(--border)] font-mono-tech font-bold text-lg py-4 uppercase"
                  >
                    {t.saveConfig}
                  </motion.button>
                </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;