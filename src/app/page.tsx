'use client';

import { useState } from 'react';
import ResultsDashboard from '@/components/ResultsDashboard';

export default function Home() {
  const [target, setTarget] = useState('');
  const [targetVersion, setTargetVersion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  
  // Updater state
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  // Active Scan State
  const [activeScan, setActiveScan] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;

    setIsLoading(true);
    setError('');
    setResults(null);
    setScanLogs([]);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, activeScan }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      
      if (!response.body) throw new Error("ReadableStream not supported.");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === 'log') {
              setScanLogs(prev => [...prev, data.message]);
            } else if (data.type === 'result') {
              setResults(data.data);
            } else if (data.type === 'error') {
              setError(data.message);
            }
          } catch (e) {
            console.error('Failed to parse line:', line);
          }
        }
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during the scan.');
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

        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <input 
            type="checkbox" 
            id="activeScanToggle" 
            checked={activeScan}
            onChange={(e) => setActiveScan(e.target.checked)}
            disabled={isLoading}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="activeScanToggle" style={{ color: '#fca5a5', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
            <strong>Enable Active Exploitation (Nuclei)</strong> — Sends active payloads to definitively confirm vulnerabilities. Use ONLY with authorization.
          </label>
        </div>

        <button type="submit" className="btn" disabled={isLoading || !target.trim()} style={{ marginTop: '1rem' }}>
          {isLoading ? <div className="loader"></div> : 'Scan Target'}
        </button>
      </form>

      {/* Terminal Output */}
      {(isLoading || scanLogs.length > 0) && !results && (
        <div className="terminal-window fade-in" style={{ marginBottom: '2rem' }}>
          <div className="terminal-header">
            <span className="dot" style={{ background: '#ef4444' }}></span>
            <span className="dot" style={{ background: '#f59e0b' }}></span>
            <span className="dot" style={{ background: '#10b981' }}></span>
            <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>nuclei-engine</span>
          </div>
          <div className="terminal-body" style={{ display: 'flex', flexDirection: 'column' }}>
            {scanLogs.map((log, index) => {
              // Colorize common nuclei tags
              let logColor = '#e2e8f0';
              if (log.includes('[INF]')) logColor = '#60a5fa'; // Blue
              if (log.includes('[WRN]')) logColor = '#f59e0b'; // Amber
              if (log.includes('[ERR]')) logColor = '#ef4444'; // Red
              if (log.includes('[ALARM]')) logColor = '#ef4444'; // Red
              if (log.includes('[*]') || log.includes('[+]')) logColor = '#10b981'; // Green
              
              return (
                <span key={index} style={{ color: logColor }}>{log}</span>
              );
            })}
            {isLoading && (
              <span className="cursor-blink" style={{ color: '#10b981', marginTop: '4px' }}>_</span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message fade-in">
          <strong>Scan Failed:</strong> {error}
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
