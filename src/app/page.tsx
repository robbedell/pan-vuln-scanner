'use client';

import { useState } from 'react';
import ResultsDashboard from '@/components/ResultsDashboard';

export default function Home() {
  const [target, setTarget] = useState('');
  const [targetVersion, setTargetVersion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);
  
  // Updater state
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform scan');
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during scanning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateMessage('Pulling latest code from GitHub...');
    try {
      const response = await fetch('/api/update', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setUpdateMessage('App updated successfully! Hot-reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setUpdateMessage(`Update failed: ${data.error}`);
      }
    } catch (err: any) {
      setUpdateMessage('An error occurred while updating.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <main className="container">
      <div className="header fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>PAN-OS Vulnerability Scanner</h1>
          <p>Analyze exposed Palo Alto Networks firewalls for critical vulnerabilities reported in 2024, 2025, and 2026.</p>
        </div>
        <button 
          onClick={handleUpdate} 
          disabled={isUpdating}
          className="btn" 
          style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          {isUpdating ? 'Updating...' : '🔄 Update App'}
        </button>
      </div>

      {updateMessage && (
        <div className="slide-up" style={{ background: 'var(--accent-color)', color: '#000', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>
          {updateMessage}
        </div>
      )}

      <form onSubmit={handleScan} className="search-container slide-up" style={{ animationDelay: '0.1s' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Enter target IP or Domain (e.g., 192.168.1.1 or vpn.company.com)" 
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={isLoading}
            style={{ flex: 2 }}
          />
          <input 
            type="text" 
            className="search-input" 
            placeholder="PAN-OS Version (Optional, e.g. 11.1.2-h3)" 
            value={targetVersion}
            onChange={(e) => setTargetVersion(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
        </div>
        <button type="submit" className="btn" disabled={isLoading || !target.trim()} style={{ marginTop: '1rem' }}>
          {isLoading ? <div className="loader"></div> : 'Scan Target'}
        </button>
      </form>

      {error && (
        <div className="error-message slide-up">
          {error}
        </div>
      )}

      {results && (
        <div className="fade-in">
          <ResultsDashboard results={results} targetVersion={targetVersion} />
        </div>
      )}

      {!results && !isLoading && !error && (
        <div className="empty-state slide-up" style={{ animationDelay: '0.2s' }}>
          <h3>Ready to Scan</h3>
          <p>Enter a target above to begin passive reconnaissance. This tool checks for exposed GlobalProtect and Management interfaces.</p>
        </div>
      )}
    </main>
  );
}
