import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  results: any;
  exposedCount: number;
  targetVersion?: string;
  aiConfig?: any;
}

export default function DashboardSummary({ results, exposedCount, targetVersion, aiConfig }: Props) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!aiConfig?.aiBaseUrl) return;

    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const prompt = `Write a very brief, 2-3 sentence high-level summary of this security scan for ${results.target}. 
Exposed Interfaces: ${results.exposedInterfaces.join(', ') || 'None'}.
Potential Vulnerabilities: ${exposedCount}.
Exploited CVEs: ${results.confirmedCVEs?.join(', ') || 'None'}.
Make it punchy and professional.`;

        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            baseURL: aiConfig.aiBaseUrl,
            model: aiConfig.aiModel,
            apiKey: aiConfig.aiApiKey,
            disableStream: true
          })
        });
        
        const data = await res.json();
        if (data.content) setSummary(data.content);
      } catch (e) {
        console.error('Failed to fetch dashboard summary', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [results, aiConfig]);

  if (!aiConfig?.aiBaseUrl) return null;

  return (
    <div className="glass fade-in" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(168, 85, 247, 0.3)', background: 'rgba(168, 85, 247, 0.05)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '1rem', color: '#d8b4fe' }}>
        🤖 AI Security Posture Summary
      </h3>
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
          Analyzing scan results...
        </div>
      ) : summary ? (
        <div className="ai-markdown-container" style={{ fontSize: '0.95rem', color: '#e2e8f0', lineHeight: 1.6 }}>
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      ) : (
        <div style={{ color: 'var(--text-secondary)' }}>Summary unavailable.</div>
      )}
    </div>
  );
}
