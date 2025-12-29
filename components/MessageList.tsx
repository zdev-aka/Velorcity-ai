import React, { useRef, useEffect, useState } from 'react';
import { Message, ToolCall } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import SyntaxHighlighter from 'react-syntax-highlighter';
// Removed grayscale import to avoid hardcoded styles conflict with dark mode
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Terminal, ShieldAlert, Play, Activity, FileText, Code, ArrowRight, Brain, ThumbsUp, ThumbsDown, Edit2, Zap } from 'lucide-react';
import { getTranslation } from '../constants/translations';

interface Props {
  messages: Message[];
  isLoading: boolean;
  onApproveTool: (toolCallId: string, name: string, args: any) => void;
  executingToolId: string | null;
  onOpenArtifact?: (id: string) => void;
  onEditMessage?: (id: string, content: string) => void;
  language: string;
}

// --- COMPONENTS ---

// Component to handle <think> tags logic
const ThinkingBlock: React.FC<{ content: string, t: any }> = ({ content, t }) => {
    const [isOpen, setIsOpen] = useState(true); // Default to open to show the effect immediately
    
    // Remove the tags from display if they exist in the chunk
    const cleanContent = content.replace(/<\/?think>/g, '').trim();

    if (!cleanContent) return null;

    return (
        <div className="my-2 mb-4 border-l-2 border-[var(--muted-foreground)]/30 pl-3">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-2 text-[10px] font-mono-tech font-bold uppercase tracking-widest text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors select-none mb-1"
            >
                <Brain size={12} className={isOpen ? "text-[var(--foreground)]" : ""} /> 
                {isOpen ? t.hideThinking : t.thinking}
                {!isOpen && <span className="animate-pulse">_</span>}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-1 text-xs text-[var(--muted-foreground)] italic font-serif leading-relaxed opacity-80 whitespace-pre-wrap">
                            {cleanContent}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Advanced Text Render capable of splitting text by <think> tags
// Improved regex to handle streaming (unclosed tags) and ensuring split captures content
const AdvancedContentRenderer: React.FC<{ text: string, t: any }> = ({ text, t }) => {
    // Split by <think>...content...</think>
    // The regex captures the delimiter so we can process it.
    // (?:<\/think>|$) matches either the closing tag OR the end of string (for streaming)
    const parts = text.split(/(<think>[\s\S]*?(?:<\/think>|$))/g);

    return (
        <div className="space-y-1">
            {parts.map((part, idx) => {
                if (part.startsWith('<think>')) {
                    return <ThinkingBlock key={idx} content={part} t={t} />;
                }
                if (!part.trim()) return null;
                return (
                    <div key={idx} className="markdown-body font-normal">
                         <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{ code: CodeBlock }}
                        >
                            {part}
                        </ReactMarkdown>
                    </div>
                );
            })}
        </div>
    );
};

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="my-4 border-2 border-[var(--foreground)] bg-[var(--background)] relative group font-mono overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1 border-b-2 border-[var(--foreground)] bg-[var(--muted)]">
           <div className="flex items-center gap-2">
             <Terminal size={14} strokeWidth={2.5} />
             <span className="text-xs font-bold uppercase">{language}</span>
           </div>
           <button onClick={handleCopy} className="flex items-center gap-1 hover:underline">
             {isCopied ? <Check size={14} /> : <Copy size={14} />}
           </button>
        </div>
        <div className="p-0 text-sm">
             <SyntaxHighlighter
                {...props}
                // Removed 'style={grayscale}' to fix dark mode contrast. 
                // Using empty style object + customStyle with CSS vars instead.
                style={{}} 
                language={language}
                PreTag="div"
                showLineNumbers={true}
                customStyle={{ 
                    margin: 0, 
                    padding: '1rem', 
                    background: 'var(--muted)', // Adaptive background
                    color: 'var(--foreground)', // Adaptive text color (White in dark, Black in light)
                    lineHeight: '1.5',
                }}
                codeTagProps={{
                    style: { fontFamily: 'inherit' }
                }}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  return (
    <code className={`${className} bg-[var(--muted)] px-1 py-0.5 font-bold font-mono-tech text-sm border border-[var(--border)]`} {...props}>
      {children}
    </code>
  );
};

const MessageActions = ({ 
    id,
    content, 
    isUser, 
    onEdit 
}: { 
    id: string,
    content: string, 
    isUser: boolean, 
    onEdit?: (id: string, text: string) => void 
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [vote, setVote] = useState<'up'|'down'|null>(null);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button 
                onClick={handleCopy}
                className="p-1 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors rounded"
                title="Copy text"
            >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            
            {isUser && onEdit && (
                <button 
                    onClick={() => onEdit(id, content)}
                    className="p-1 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors rounded"
                    title="Edit message"
                >
                    <Edit2 size={14} />
                </button>
            )}

            {!isUser && (
                <>
                    <button 
                        onClick={() => setVote(vote === 'up' ? null : 'up')}
                        className={`p-1 hover:bg-[var(--muted)] transition-colors rounded ${vote === 'up' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}
                    >
                        <ThumbsUp size={14} />
                    </button>
                    <button 
                        onClick={() => setVote(vote === 'down' ? null : 'down')}
                        className={`p-1 hover:bg-[var(--muted)] transition-colors rounded ${vote === 'down' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}
                    >
                        <ThumbsDown size={14} />
                    </button>
                </>
            )}
        </div>
    );
};

const ArtifactCard: React.FC<{ 
    toolCall: ToolCall, 
    onOpen: (id: string) => void 
}> = ({ toolCall, onOpen }) => {
    const result = toolCall.result || {};
    if (!result.isArtifact || !result.artifactId) return null;

    return (
        <motion.div
            layoutId={`artifact-${result.artifactId}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02, x: 5 }}
            onClick={() => onOpen(result.artifactId)}
            className="mt-4 cursor-pointer group"
        >
            <div className="border-2 border-[var(--foreground)] bg-[var(--background)] shadow-neo hover:shadow-neo-lg transition-all p-0 overflow-hidden max-w-sm">
                <div className="h-2 bg-[var(--foreground)] w-full" />
                <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
                            {result.type === 'code' ? <Code size={24} /> : <FileText size={24} />}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm uppercase leading-tight">{result.title}</h4>
                            <p className="text-[10px] font-mono-tech text-[var(--muted-foreground)]">Click to expand content</p>
                        </div>
                    </div>
                    <div className="p-2 border border-[var(--border)] rounded-full group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)] transition-colors">
                        <ArrowRight size={16} />
                    </div>
                </div>
                <div className="bg-[var(--muted)] px-4 py-1 border-t border-[var(--border)] flex justify-between items-center text-[10px] font-mono-tech">
                    <span>ARTIFACT GENERATED</span>
                    <span>{result.type?.toUpperCase()}</span>
                </div>
            </div>
        </motion.div>
    );
};

const ToolApprovalCard: React.FC<{ 
    toolCall: ToolCall, 
    onApprove: () => void,
    isExecuting: boolean,
    onOpenArtifact?: (id: string) => void
}> = ({ toolCall, onApprove, isExecuting, onOpenArtifact }) => {
    
    if (toolCall.state === 'result' && toolCall.result?.isArtifact && onOpenArtifact) {
        return <ArtifactCard toolCall={toolCall} onOpen={onOpenArtifact} />;
    }

    // --- HACKER GREEN AESTHETIC ---
    const hackerStyle = "border-[#00ff41] text-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.2)]";
    const hackerBg = "bg-black"; // Ensure high contrast for green text

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            className={`mt-4 border-2 p-4 w-full max-w-md relative overflow-hidden font-mono-tech ${hackerBg} ${hackerStyle}`}
        >
            {/* Scanline overlay for hacker effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(0,255,0,0.06),rgba(0,255,0,0.02))] bg-[length:100%_4px,6px_100%] pointer-events-none z-0 opacity-40" />

            <div className="flex items-start gap-3 mb-3 relative z-10">
                <div className="animate-pulse">
                     <ShieldAlert className="shrink-0" size={24} strokeWidth={2} />
                </div>
                <div>
                    <h4 className="font-bold uppercase text-sm leading-none mb-1 tracking-wider">Permission Request</h4>
                    <p className="text-[10px] opacity-80">System requesting root access to external tool.</p>
                </div>
            </div>
            
            <div className="bg-[#002200] border border-[#00ff41]/50 p-3 mb-4 text-xs overflow-x-auto relative z-10 shadow-inner">
                <div className="font-bold mb-1 flex justify-between">
                    <span>FUNCTION: {toolCall.toolName}</span>
                    <Zap size={12} className="text-[#00ff41] animate-bounce"/>
                </div>
                <div className="opacity-80 font-mono">ARGS: {JSON.stringify(toolCall.args)}</div>
            </div>

            {toolCall.state === 'call' && (
                <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(0,255,65, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onApprove}
                    disabled={isExecuting}
                    className="w-full relative z-10 flex items-center justify-center gap-2 bg-[#00ff41] text-black font-bold py-2 uppercase border border-[#00ff41] hover:shadow-[0_0_15px_#00ff41] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isExecuting ? (
                        <><Activity className="animate-spin" size={16} /> Executing Protocol...</>
                    ) : (
                        <><Play size={16} fill="currentColor" /> Approve & Run</>
                    )}
                </motion.button>
            )}
            
            {toolCall.state === 'result' && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="flex items-center gap-2 text-xs font-bold border-t border-[#00ff41]/50 pt-2 mt-2 relative z-10"
                >
                    <Check size={14} /> EXECUTED SUCCESSFULLY
                </motion.div>
            )}
        </motion.div>
    );
};

const LoadingIndicator = () => (
    <div className="flex items-center gap-3 pl-4 py-2">
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
            className="relative w-6 h-6 border-2 border-[var(--border)] border-t-transparent rounded-full"
         />
         <motion.div 
            className="font-mono-tech font-bold text-xs uppercase tracking-widest text-[var(--muted-foreground)]"
         >
            <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                Thinking
            </motion.span>
            <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, times: [0, 0.5, 1] }}
            >_</motion.span>
         </motion.div>
    </div>
);

const MessageList: React.FC<Props> = ({ messages, isLoading, onApproveTool, executingToolId, onOpenArtifact, onEditMessage, language }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(language);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, executingToolId]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, type: "spring" }}
          className="max-w-xl p-8 border-4 border-[var(--foreground)] shadow-neo-lg bg-[var(--background)] relative overflow-hidden"
        >
          {/* Decorative scanline */}
          <motion.div 
             initial={{ top: '-10%' }}
             animate={{ top: '110%' }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
             className="absolute left-0 w-full h-1 bg-[var(--foreground)] opacity-20 z-0"
          />

          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter relative z-10 glitch-text" data-text="VELORCITY">
            VELORCITY
          </h1>
          {/* REMOVED: Monochrome Interface v2.0 text */}
          <div className="flex gap-2 justify-center relative z-10">
             <span className="px-2 py-1 bg-[var(--muted)] border border-[var(--border)] text-xs font-bold font-mono-tech hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors cursor-default">
                LATEX SUPPORTED
             </span>
             <span className="px-2 py-1 bg-[var(--muted)] border border-[var(--border)] text-xs font-bold font-mono-tech hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors cursor-default">
                SECURE TOOLS
             </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8">
        <AnimatePresence mode="popLayout">
            {messages.map((msg, index) => {
                if (msg.role === 'tool') {
                    // Discreet log for tool outputs
                    return (
                        <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            className="text-[10px] font-mono-tech text-[var(--muted-foreground)] pl-4 border-l border-[var(--border)]"
                        >
                            {`> SYSTEM: TOOL_OUTPUT_RECEIVED [ID:${msg.id.substring(0,6)}]`}
                        </motion.div>
                    );
                }

                return (
                <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    layout
                    className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                    <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className={`text-[10px] font-bold font-mono-tech uppercase px-1 border border-[var(--border)] ${
                            msg.role === 'user' 
                            ? 'bg-[var(--foreground)] text-[var(--background)]' 
                            : 'bg-[var(--background)] text-[var(--foreground)]'
                        }`}>
                            {msg.role === 'user' ? t.human : t.machine}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)] font-mono-tech">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>

                    {msg.role === 'user' ? (
                        <motion.div 
                            whileHover={{ scale: 1.01 }}
                            className="max-w-[85%] bg-[var(--muted)] border-2 border-[var(--border)] p-4 shadow-neo-sm relative"
                        >
                            <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                        </motion.div>
                    ) : (
                        <div className="w-full max-w-[90%]">
                            {msg.content && (
                                <div className="bg-[var(--background)] border-l-4 border-[var(--foreground)] pl-4 py-2">
                                    <AdvancedContentRenderer text={msg.content} t={t} />
                                </div>
                            )}
                            
                            {/* Render Tool Calls if any */}
                            {msg.toolCalls && msg.toolCalls.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {msg.toolCalls.map(tc => (
                                        <ToolApprovalCard 
                                            key={tc.toolCallId} 
                                            toolCall={tc}
                                            onApprove={() => onApproveTool(tc.toolCallId, tc.toolName, tc.args)}
                                            isExecuting={executingToolId === tc.toolCallId}
                                            onOpenArtifact={onOpenArtifact}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Action Bar */}
                    <MessageActions 
                        id={msg.id}
                        content={msg.content} 
                        isUser={msg.role === 'user'}
                        onEdit={onEditMessage}
                    />
                </motion.div>
                );
            })}
        </AnimatePresence>

        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
};

export default MessageList;