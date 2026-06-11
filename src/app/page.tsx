'use client';

import { useState } from 'react';
import ResultsDashboard from '@/components/ResultsDashboard';

export default function Home() {
  const [target, setTarget] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);

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

  return (
    <main className="container">
      <div className="header fade-in">
        <h1>PAN-OS Vulnerability Scanner</h1>
        <p>Analyze exposed Palo Alto Networks firewalls for critical vulnerabilities reported in 2024, 2025, and 2026.</p>
      </div>

      <form onSubmit={handleScan} className="search-container slide-up" style={{ animationDelay: '0.1s' }}>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Enter target IP or Domain (e.g., 192.168.1.1 or vpn.company.com)" 
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="btn" disabled={isLoading || !target.trim()}>
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
          <ResultsDashboard results={results} />
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
