import { cveDatabase, Vulnerability } from '@/lib/vulnerabilities';
import { generateJSONReport, generateMarkdownReport } from '@/lib/reportGenerator';
import VulnerabilityCard from './VulnerabilityCard';

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
}

export default function ResultsDashboard({ results, targetVersion }: ResultsProps) {
  const isExposed = (vuln: Vulnerability) => {
    if (vuln.triggerInterface === 'GlobalProtect') return results.hasGlobalProtect;
    if (vuln.triggerInterface === 'Management') return results.hasManagement;
    if (vuln.triggerInterface === 'Both') return results.hasGlobalProtect || results.hasManagement;
    return false;
  };

  const exposedCount = cveDatabase.filter(isExposed).length;

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
          onClick={() => generateMarkdownReport(results, targetVersion, cveDatabase)}
          className="btn" 
          style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#93c5fd', padding: '0.75rem 1rem', fontSize: '0.95rem', flex: 1 }}
        >
          📥 Download Markdown Report
        </button>
        <button 
          onClick={() => generateJSONReport(results, targetVersion, cveDatabase)}
          className="btn" 
          style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#e2e8f0', padding: '0.75rem 1rem', fontSize: '0.95rem', flex: 1 }}
        >
          📥 Download JSON Data
        </button>
      </div>

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
          <div className="vuln-list">
            {cveDatabase.map(vuln => (
              <VulnerabilityCard 
                key={vuln.id} 
                vulnerability={vuln} 
                isExposed={isExposed(vuln)} 
                targetVersion={targetVersion}
                isConfirmed={results.confirmedCVEs?.includes(vuln.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
