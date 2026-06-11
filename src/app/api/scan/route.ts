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

    // Clean target (remove http:// or https:// if provided)
    const protocol = target.startsWith('http://') ? 'http://' : 'https://';
    const host = target.replace(/^(https?:\/\/)/, '').replace(/\/$/, '');

    // Paths to check
    const gpUrl = `${protocol}${host}/global-protect/login.esp`;
    const mgmtUrl = `${protocol}${host}/php/login.php`;
    const rootUrl = `${protocol}${host}/`;

    // Perform checks concurrently
    const [gpRes, mgmtRes, rootRes] = await Promise.all([
      checkEndpoint(gpUrl),
      checkEndpoint(mgmtUrl),
      checkEndpoint(rootUrl)
    ]);

    const isReachable = gpRes.status > 0 || mgmtRes.status > 0 || rootRes.status > 0;
    
    let hasGlobalProtect = false;
    let hasManagement = false;

    // Strict Fingerprinting for GlobalProtect
    const gpBody = gpRes.body.toLowerCase();
    if (gpRes.status === 200 && (gpBody.includes('<title>globalprotect portal</title>') || gpBody.includes('var loginuser =') || gpBody.includes('/global-protect/login.esp'))) {
      hasGlobalProtect = true;
    } else if (rootRes.status === 200 && rootRes.body.toLowerCase().includes('<title>globalprotect portal</title>')) {
      hasGlobalProtect = true;
    }

    // Strict Fingerprinting for Management Interface
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

    // Active Exploitation (if enabled)
    let confirmedCVEs: string[] = [];
    if (activeScan) {
      console.log(`Running active Nuclei scan against ${host}...`);
      try {
        const { stdout } = await execPromise(`nuclei -u ${protocol}${host} -tags paloalto,panos -jsonl -silent`);
        const lines = stdout.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          const result = JSON.parse(line);
          if (result && result['template-id']) {
            const match = result['template-id'].match(/(CVE-\d{4}-\d{4,5})/i);
            if (match) {
              confirmedCVEs.push(match[1].toUpperCase());
            }
          }
        }
      } catch (err) {
        console.error('Nuclei scan failed or returned no results:', err);
      }
    }

    return NextResponse.json({
      target: host,
      isReachable,
      hasGlobalProtect,
      hasManagement,
      exposedInterfaces,
      confirmedCVEs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scan Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
