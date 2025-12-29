import React, { useState, useEffect } from 'react';
import { Artifact } from '../types';
import { X, Save, FileText, Code, PanelRightClose } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { grayscale } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { getTranslation } from '../constants/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  artifact: Artifact | null;
  onUpdate: (id: string, newContent: string) => void;
  language: string;
}

const ArtifactViewer: React.FC<Props> = ({ isOpen, onClose, artifact, onUpdate, language }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const t = getTranslation(language);

  useEffect(() => {
    if (artifact) {
      setContent(artifact.content);
      setIsEditing(false);
    }
  }, [artifact]);

  const handleSave = () => {
    if (artifact) {
      onUpdate(artifact.id, content);
      setIsEditing(false);
    }
  };

  if (!artifact) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--foreground)]/30 backdrop-blur-[2px] z-40 lg:hidden"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[600px] lg:w-[800px] bg-[var(--background)] border-l-4 border-[var(--border)] shadow-[-8px_0px_0px_0px_var(--shadow-color)] flex flex-col"
          >
              {/* Header */}
              <div className="p-4 border-b-4 border-[var(--border)] flex justify-between items-center bg-[var(--muted)] shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="p-2 bg-[var(--background)] border-2 border-[var(--border)] shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                     {artifact.type === 'code' ? <Code size={20} /> : <FileText size={20} />}
                   </div>
                   <div className="flex flex-col min-w-0">
                       <h2 className="text-lg font-black uppercase truncate">{artifact.title}</h2>
                       <span className="text-[10px] font-mono-tech text-[var(--muted-foreground)] uppercase tracking-wider">
                           ID: {artifact.id.substring(0, 8)}
                       </span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 hover:bg-red-500 hover:text-white transition-colors border-2 border-transparent hover:border-[var(--border)] group">
                        <PanelRightClose size={24} className="group-hover:rotate-180 transition-transform duration-300" />
                    </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="p-2 border-b-2 border-[var(--border)] flex gap-2 bg-[var(--background)] shrink-0">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-3 py-1 text-xs font-bold font-mono-tech uppercase border-2 border-[var(--border)] transition-all ${isEditing ? 'bg-[var(--foreground)] text-[var(--background)]' : 'hover:bg-[var(--muted)] active:translate-y-[1px]'}`}
                  >
                      {isEditing ? t.previewMode : t.editMode}
                  </button>
                  {isEditing && (
                      <button 
                        onClick={handleSave}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold font-mono-tech uppercase border-2 border-[var(--border)] bg-green-500 text-white hover:bg-green-600 active:translate-y-[1px]"
                      >
                          <Save size={12} /> {t.saveChanges}
                      </button>
                  )}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-auto custom-scrollbar bg-[var(--background)] relative">
                  {isEditing ? (
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-full p-6 bg-[var(--background)] font-mono text-sm resize-none outline-none leading-relaxed text-[var(--foreground)]"
                        spellCheck={false}
                      />
                  ) : (
                      <div className="p-6">
                        {artifact.type === 'code' ? (
                             <SyntaxHighlighter
                                style={grayscale}
                                language="typescript" 
                                PreTag="div"
                                showLineNumbers={true}
                                customStyle={{ 
                                    background: 'var(--muted)', 
                                    border: '2px solid var(--border)',
                                    padding: '1.5rem',
                                    fontSize: '0.9rem',
                                    borderRadius: '0px'
                                }}
                            >
                                {content}
                            </SyntaxHighlighter>
                        ) : (
                            <div className="markdown-body">
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        code({node, inline, className, children, ...props}: any) {
                                            const match = /language-(\w+)/.exec(className || '')
                                            return !inline && match ? (
                                            <SyntaxHighlighter
                                                style={grayscale}
                                                language={match[1]}
                                                PreTag="div"
                                                {...props}
                                                customStyle={{
                                                    background: 'var(--muted)',
                                                    border: '1px solid var(--border)'
                                                }}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                            ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                            )
                                        }
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        )}
                      </div>
                  )}
              </div>
              
              {/* Footer Info - Moved outside scroll area */}
              <div className="p-2 border-t-2 border-[var(--border)] bg-[var(--muted)] text-[10px] font-mono-tech text-center text-[var(--muted-foreground)] shrink-0">
                  {t.lastMod}: {new Date(artifact.updatedAt).toLocaleString()}
              </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ArtifactViewer;