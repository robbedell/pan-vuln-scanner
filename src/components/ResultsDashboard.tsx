import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cveDatabase, Vulnerability } from '@/lib/vulnerabilities';
import { generateJSONReport } from '@/lib/reportGenerator';
import VulnerabilityCard from './VulnerabilityCard';
import DashboardSummary from './DashboardSummary';
import ChatBox from './ChatBox';

interface ResultsProps {
  results: {
    target: string;
    isReachable: boolean;
    hasGlobalProtect: boolean;
    hasManagement: boolean;
    exposedInterfaces: string[];
    confirmedCVEs?: string[];
  };
  targetVersion?: string;
  aiConfig?: {
    aiBaseUrl: string;
    aiModel: string;
    aiApiKey: string;
  };
}

export default function ResultsDashboard({ results, targetVersion, aiConfig }: ResultsProps) {
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [pdfMarkdown, setPdfMarkdown] = useState('');
  
  const isExposed = (vuln: Vulnerability) => {
    if (vuln.triggerInterface === 'GlobalProtect') return results.hasGlobalProtect;
    if (vuln.triggerInterface === 'Management') return results.hasManagement;
    if (vuln.triggerInterface === 'Both') return results.hasGlobalProtect || results.hasManagement;
    return false;
  };

  const exposedCount = cveDatabase.filter(isExposed).length;

  const handleGeneratePDF = async () => {
    if (!aiConfig || !aiConfig.aiBaseUrl) {
      alert("Please configure the AI in Settings first!");
      return;
    }
    
    setIsGeneratingSummary(true);
    let fullReportMarkdown = '';

    try {
      const cveContext = cveDatabase.filter(isExposed).map(cve => `
- ${cve.id} (${cve.name}):
  Root Cause: ${cve.rootCause}
  Mitigation: ${cve.howToFix}
`).join('\n');

      const prompt = `Act as a Senior Security Engineer. Write a comprehensive Penetration Testing Report for a vulnerability scan against ${results.target}.
The target is running PAN-OS version ${targetVersion || 'Unknown'} and has the following exposed interfaces: ${results.exposedInterfaces.join(', ') || 'None'}.
Confirmed Exploited CVEs: ${results.confirmedCVEs?.join(', ') || 'None'}.
Potential Vulnerabilities based on exposed interfaces: ${exposedCount}.

Context on the vulnerabilities:
${cveContext}

Output the report in Markdown format. Include the following sections: 
1. Executive Summary
2. Scope & Target Information
3. Findings Summary
4. Technical Details & Root Cause Analysis
5. Remediation Recommendations

Be highly professional, detailed, and use Markdown tables and code blocks where appropriate. Do not include any conversational intro/outro text, just the Markdown report.`;

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
      if (data.content) {
        fullReportMarkdown = data.content;
        setPdfMarkdown(fullReportMarkdown);
        
        // Give React a tick to render the hidden markdown container
        setTimeout(async () => {
          const element = document.getElementById('pdf-report-container');
          if (element) {
            // Dynamically import html2pdf
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
              margin:       0.5,
              filename:     `Vulnerability_Report_${results.target}.pdf`,
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2 },
              jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
          }
        }, 500);
      }
    } catch (err) {
      console.error('AI PDF Generation failed', err);
      alert("Failed to generate AI PDF Report. Check your AI connection.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div>
      <div className="dashboard-grid slide-up">
        <div className="glass status-card">
          <span className="status-title">Target Host</span>
          <div className="status-value">{results.target}</div>
        </div>

        <div className="glass status-card">
          <span className="status-title">Reachability</span>
          <div className="status-value">
            <span className={`status-indicator ${results.isReachable ? 'reachable' : 'unreachable'}`}></span>
            {results.isReachable ? 'Online' : 'Unreachable'}
          </div>
        </div>

        <div className="glass status-card">
          <span className="status-title">Exposed Interfaces</span>
          <div className="tag-list">
            {results.exposedInterfaces.length > 0 ? (
              results.exposedInterfaces.map((iface, idx) => (
                <span key={idx} className="tag warning">{iface}</span>
              ))
            ) : (
              <span className="tag">None Detected</span>
            )}
          </div>
        </div>
      </div>

      <div className="slide-up" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '2rem', animationDelay: '0.1s' }}>
        <button 
          onClick={handleGeneratePDF}
          disabled={isGeneratingSummary || !aiConfig?.aiBaseUrl}
          className="btn" 
          style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#d8b4fe', padding: '0.75rem 1rem', fontSize: '0.95rem', flex: 1 }}
        >
          {isGeneratingSummary ? '🤖 Generating Professional PDF Report...' : '🤖 Generate AI PDF Report'}
        </button>
        <button 
          onClick={() => generateJSONReport(results, targetVersion, cveDatabase)}
          className="btn" 
          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#e2e8f0', padding: '0.75rem 1rem', fontSize: '0.95rem', flex: 1 }}
        >
          📥 Download Raw JSON
        </button>
      </div>

      {/* Hidden container for PDF rendering */}
      {pdfMarkdown && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
          <div id="pdf-report-container" className="pdf-theme ai-markdown-container">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{pdfMarkdown}</ReactMarkdown>
          </div>
        </div>
      )}

      {results.isReachable && (
        <div className="vuln-section slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="vuln-section-title">
            {exposedCount > 0 
              ? `⚠️ ${exposedCount} Potential Vulnerabilities Found` 
              : '✅ Database Check Complete'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {exposedCount === 0 
              ? 'We did not detect exposed GlobalProtect or Management interfaces that match known critical CVEs from 2024/2025/2026. However, always ensure your firmware is fully patched and follow best practices.'
              : 'The target exposes interfaces that are known to be vulnerable to the following CVEs unless patched.'}
          </p>

          <DashboardSummary 
            results={results} 
            exposedCount={exposedCount} 
            targetVersion={targetVersion} 
            aiConfig={aiConfig} 
          />

          <div className="vuln-list">
            {cveDatabase.map(vuln => (
              <VulnerabilityCard 
                key={vuln.id} 
                vulnerability={vuln} 
                isExposed={isExposed(vuln)} 
                targetVersion={targetVersion}
                isConfirmed={results.confirmedCVEs?.includes(vuln.id)}
                aiConfig={aiConfig}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating Chat Box */}
      <ChatBox results={results} aiConfig={aiConfig} />
    </div>
  );
}
