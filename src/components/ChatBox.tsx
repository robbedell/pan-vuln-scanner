import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cveDatabase, Vulnerability } from '@/lib/vulnerabilities';

interface ChatBoxProps {
  results: any;
  aiConfig: any;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function ChatBox({ results, aiConfig }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isExposed = (vuln: Vulnerability) => {
    if (vuln.triggerInterface === 'GlobalProtect') return results.hasGlobalProtect;
    if (vuln.triggerInterface === 'Management') return results.hasManagement;
    if (vuln.triggerInterface === 'Both') return results.hasGlobalProtect || results.hasManagement;
    return false;
  };

  useEffect(() => {
    // Initialize the system prompt and a welcome message when opened for the first time
    if (isOpen && messages.length === 0) {
      const exposedCount = cveDatabase.filter(isExposed).length;
      const cveContext = cveDatabase.filter(isExposed).map(cve => `
- ${cve.id} (${cve.name}):
  Root Cause: ${cve.rootCause}
  Mitigation: ${cve.howToFix}
`).join('\n');

      const systemPrompt = `You are a Palo Alto Networks expert security assistant. The user has just run a vulnerability scan against ${results.target}.
Exposed Interfaces: ${results.exposedInterfaces.join(', ') || 'None'}.
Confirmed Exploited CVEs: ${results.confirmedCVEs?.join(', ') || 'None'}.
Potential Vulnerabilities: ${exposedCount}.
Context on vulnerabilities:
${cveContext}

Answer the user's questions about these findings, how to remediate them, or explain the exploit paths. Be highly technical, concise, and professional. Use Markdown.`;

      setMessages([
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: "Hi! I'm your AI Security Analyst. I've reviewed the scan results for this target. What questions do you have about the findings or remediation steps?" }
      ]);
    }
  }, [isOpen, results]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    if (!aiConfig?.aiBaseUrl) {
      alert("Please configure AI Settings first!");
      return;
    }

    const userMessage = { role: 'user' as const, content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          baseURL: aiConfig.aiBaseUrl,
          model: aiConfig.aiModel,
          apiKey: aiConfig.aiApiKey,
          disableStream: false
        })
      });

      if (!response.body) throw new Error('No response stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantContent;
          return updated;
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Connection error. Check your AI settings.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!aiConfig?.aiBaseUrl) return null;

  return (
    <>
      <button 
        className="chat-toggle-btn slide-up" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ animationDelay: '0.5s' }}
      >
        {isOpen ? '✕' : '💬 Ask AI Analyst'}
      </button>

      {isOpen && (
        <div className="chat-window fade-in">
          <div className="chat-header">
            <h3>🤖 Security Analyst</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
          
          <div className="chat-messages">
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.role === 'assistant' ? (
                  <div className="ai-markdown-container" style={{ fontSize: '0.9rem' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {isTyping && (
              <div className="chat-message assistant">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="chat-input-area">
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Ask about vulnerabilities..." 
              disabled={isTyping}
            />
            <button type="submit" disabled={isTyping || !input.trim()}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}
