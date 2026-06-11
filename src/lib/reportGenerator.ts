import { Vulnerability } from './vulnerabilities';
import { isVersionVulnerable } from './versionCheck';

interface ScanResults {
  target: string;
  hasGlobalProtect: boolean;
  hasManagement: boolean;
  exposedInterfaces: string[];
  confirmedCVEs?: string[];
  timestamp?: string;
}

export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateJSONReport(results: ScanResults, targetVersion: string | undefined, cveDatabase: Vulnerability[]) {
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      scannerVersion: '0.1.0',
    },
    target: {
      host: results.target,
      providedVersion: targetVersion || 'Unknown',
      interfaces: {
        globalProtectExposed: results.hasGlobalProtect,
        managementExposed: results.hasManagement,
      }
    },
    findings: cveDatabase.map(vuln => {
      const triggersGP = vuln.triggerInterface === 'GlobalProtect' || vuln.triggerInterface === 'Both';
      const triggersMgmt = vuln.triggerInterface === 'Management' || vuln.triggerInterface === 'Both';
      const isExposed = (triggersGP && results.hasGlobalProtect) || (triggersMgmt && results.hasManagement);
      const isFirmwareVulnerable = targetVersion ? isVersionVulnerable(targetVersion, vuln.affectedVersions) : null;
      const isConfirmed = results.confirmedCVEs?.includes(vuln.id) || false;

      let status = 'Not Exposed';
      if (isConfirmed) status = 'EXPLOIT SUCCESSFUL (Confirmed Vulnerable)';
      else if (!isExposed && isFirmwareVulnerable) status = 'Not Exposed, but Firmware Vulnerable';
      else if (isExposed && targetVersion && !isFirmwareVulnerable) status = 'Exposed, but Firmware Patched';
      else if (isExposed && isFirmwareVulnerable !== false) status = 'Potentially Exposed';

      return {
        cve: vuln.id,
        name: vuln.name,
        cvss: vuln.cvssScore,
        status: status,
        isConfirmed,
        isExposed
      };
    })
  };

  const filename = `pan-scan-${results.target}-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(JSON.stringify(report, null, 2), filename, 'application/json');
}

export function generateMarkdownReport(results: ScanResults, targetVersion: string | undefined, cveDatabase: Vulnerability[], executiveSummary?: string) {
  const dateStr = new Date().toLocaleString();
  
  let md = `# PAN-OS Vulnerability Scan Report\n\n`;
  md += `**Target:** \`${results.target}\`\n`;
  md += `**Date Scanned:** ${dateStr}\n`;
  md += `**Provided Firmware Version:** ${targetVersion || '*Unknown*'}\n\n`;
  
  if (executiveSummary) {
    md += `## 🤖 AI Executive Summary\n${executiveSummary}\n\n`;
  }
  
  md += `## 🌐 Exposure Summary\n`;
  md += `- **GlobalProtect Portal/Gateway:** ${results.hasGlobalProtect ? '⚠️ EXPOSED' : '✅ SECURE'}\n`;
  md += `- **Management Interface:** ${results.hasManagement ? '⚠️ EXPOSED' : '✅ SECURE'}\n\n`;
  
  md += `## 🚨 Vulnerability Findings\n\n`;

  let hasFindings = false;

  cveDatabase.forEach(vuln => {
    const triggersGP = vuln.triggerInterface === 'GlobalProtect' || vuln.triggerInterface === 'Both';
    const triggersMgmt = vuln.triggerInterface === 'Management' || vuln.triggerInterface === 'Both';
    const isExposed = (triggersGP && results.hasGlobalProtect) || (triggersMgmt && results.hasManagement);
    const isFirmwareVulnerable = targetVersion ? isVersionVulnerable(targetVersion, vuln.affectedVersions) : null;
    const isConfirmed = results.confirmedCVEs?.includes(vuln.id) || false;

    if (!isExposed && !isFirmwareVulnerable) return; // Skip completely irrelevant CVEs if version is provided and safe

    hasFindings = true;

    md += `### ${vuln.id}: ${vuln.name}\n`;
    md += `- **CVSS Score:** ${vuln.cvssScore}\n`;
    
    let status = 'Potentially Exposed';
    if (isConfirmed) status = '**🚨 EXPLOIT SUCCESSFUL (Confirmed Vulnerable)**';
    else if (!isExposed && isFirmwareVulnerable) status = 'Not Exposed, but Firmware Vulnerable';
    else if (isExposed && targetVersion && !isFirmwareVulnerable) status = '✅ Exposed, but Firmware Patched';
    
    md += `- **Status:** ${status}\n\n`;

    if (isConfirmed || isExposed) {
      md += `#### Overview\n${vuln.whyItsVulnerable}\n\n`;
      md += `#### Technical Root Cause\n${vuln.rootCause}\n\n`;
      md += `#### Remediation\n${vuln.howToFix}\n\n`;
    }
    
    md += `---\n\n`;
  });

  if (!hasFindings) {
    md += `*No critical exposures found for the provided configuration.*\n\n`;
  }

  md += `\n\n*Report generated automatically by PAN-OS Vulnerability Scanner.*\n`;

  const filename = `pan-scan-${results.target}-${new Date().toISOString().split('T')[0]}.md`;
  downloadFile(md, filename, 'text/markdown');
}
