import { NextResponse } from 'next/server';
import https from 'https';
import http from 'http';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Helper to make requests ignoring SSL errors, as firewalls often have self-signed certs
function checkEndpoint(url: string): Promise<{ status: number, body: string, headers: any, error?: string }> {
  return new Promise((resolve) => {
    try {
      const isHttp = url.startsWith('http://');
      const client = isHttp ? http : https;
      const options = {
        rejectUnauthorized: false,
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        }
      };

      const req = client.get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode || 500, body: data, headers: res.headers }));
      });
      
      req.on('error', (e) => resolve({ status: 0, body: '', headers: {}, error: e.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, body: '', headers: {}, error: 'timeout' });
      });
    } catch (error: any) {
      resolve({ status: 0, body: '', headers: {}, error: error.message });
    }
  });
}

export async function POST(req: Request) {
  try {
    const { target, activeScan } = await req.json();

    if (!target) {
      return NextResponse.json({ error: 'Target is required' }, { status: 400 });
    }

    const protocol = target.startsWith('http://') ? 'http://' : 'https://';
    const host = target.replace(/^(https?:\/\/)/, '').replace(/\/$/, '');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendJSON = (obj: any) => {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
          } catch (e) {
            // Stream might be closed
          }
        };

        try {
          sendJSON({ type: 'log', message: `[*] Initializing passive reconnaissance against ${host}...` });

          const gpUrl = `${protocol}${host}/global-protect/login.esp`;
          const mgmtUrl = `${protocol}${host}/php/login.php`;
          const rootUrl = `${protocol}${host}/`;

          const [gpRes, mgmtRes, rootRes] = await Promise.all([
            checkEndpoint(gpUrl),
            checkEndpoint(mgmtUrl),
            checkEndpoint(rootUrl)
          ]);

          const isReachable = gpRes.status > 0 || mgmtRes.status > 0 || rootRes.status > 0;
          let hasGlobalProtect = false;
          let hasManagement = false;

          const gpBody = gpRes.body.toLowerCase();
          if (gpRes.status === 200 && (gpBody.includes('<title>globalprotect portal</title>') || gpBody.includes('var loginuser =') || gpBody.includes('/global-protect/login.esp'))) {
            hasGlobalProtect = true;
          } else if (rootRes.status === 200 && rootRes.body.toLowerCase().includes('<title>globalprotect portal</title>')) {
            hasGlobalProtect = true;
          }

          const mgmtBody = mgmtRes.body.toLowerCase();
          if (mgmtRes.status === 200 && (mgmtBody.includes('<title>palo alto networks - pan-os</title>') || mgmtBody.includes('/php/login.php'))) {
            hasManagement = true;
          } else if (rootRes.status === 200 || rootRes.status === 301 || rootRes.status === 302) {
            if (rootRes.body.toLowerCase().includes('<title>palo alto networks - pan-os</title>')) {
              hasManagement = true;
            }
            const location = rootRes.headers['location'];
            if (location && location.includes('/php/login.php')) {
              hasManagement = true;
            }
          }

          const exposedInterfaces: string[] = [];
          if (hasGlobalProtect) exposedInterfaces.push('GlobalProtect');
          if (hasManagement) exposedInterfaces.push('Management');

          sendJSON({ type: 'log', message: `[+] Passive scan complete. Found: ${exposedInterfaces.join(', ') || 'None'}` });

          let confirmedCVEs: string[] = [];
          
          if (activeScan) {
            sendJSON({ type: 'log', message: '[*] Initializing ProjectDiscovery Nuclei Engine...' });
            await new Promise<void>((resolve) => {
               // Use spawn directly instead of execPromise for streaming stdout/stderr
               const { spawn } = require('child_process');
               const nuclei = spawn('nuclei', ['-u', `${protocol}${host}`, '-tags', 'paloalto,panos', '-jsonl', '-v']);
               
               nuclei.stdout.on('data', (data: Buffer) => {
                 const lines = data.toString().split('\n').filter((l: string) => l.trim() !== '');
                 for (const line of lines) {
                   try {
                     const result = JSON.parse(line);
                     if (result['template-id']) {
                       const match = result['template-id'].match(/(CVE-\d{4}-\d{4,5})/i);
                       if (match) {
                          const cve = match[1].toUpperCase();
                          confirmedCVEs.push(cve);
                          sendJSON({ type: 'log', message: `[ALARM] Nuclei successfully exploited ${cve}!` });
                       }
                     }
                   } catch(e) {
                     sendJSON({ type: 'log', message: line });
                   }
                 }
               });
               
               nuclei.stderr.on('data', (data: Buffer) => {
                  const lines = data.toString().split('\n').filter((l: string) => l.trim() !== '');
                  for (const line of lines) {
                    const cleanLine = line.replace(/\x1B\[\d+m/g, ''); // strip ansi
                    sendJSON({ type: 'log', message: cleanLine });
                  }
               });
               
               nuclei.on('close', () => {
                  sendJSON({ type: 'log', message: '[+] Nuclei engine finished.' });
                  resolve();
               });
               
               nuclei.on('error', (err: any) => {
                  sendJSON({ type: 'log', message: `[-] Nuclei failed to start: ${err.message}` });
                  resolve();
               });
            });
          }

          sendJSON({
            type: 'result',
            data: {
              target: host,
              isReachable,
              hasGlobalProtect,
              hasManagement,
              exposedInterfaces,
              confirmedCVEs,
              timestamp: new Date().toISOString()
            }
          });
          controller.close();
        } catch (e: any) {
          sendJSON({ type: 'error', message: e.message });
          controller.close();
        }
      }
    });

    return new Response(stream, { 
      headers: { 
        'Content-Type': 'application/x-ndjson', 
        'Cache-Control': 'no-cache', 
        'Connection': 'keep-alive' 
      } 
    });
  } catch (error) {
    console.error('Scan Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
