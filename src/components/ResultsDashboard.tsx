import { cveDatabase, Vulnerability } from '@/lib/vulnerabilities';
import VulnerabilityCard from './VulnerabilityCard';

interface ResultsProps {
  results: {
    target: string;
    isReachable: boolean;
    hasGlobalProtect: boolean;
    hasManagement: boolean;
    exposedInterfaces: string[];
  };
}

export default function ResultsDashboard({ results }: ResultsProps) {
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
