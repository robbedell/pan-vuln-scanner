export interface Vulnerability {
  id: string;
  name: string;
  cvssScore: number;
  triggerInterface: 'GlobalProtect' | 'Management' | 'Both';
  year: number;
  whyItsVulnerable: string;
  howToFix: string;
}

export const cveDatabase: Vulnerability[] = [
  {
    id: 'CVE-2024-3400',
    name: 'GlobalProtect OS Command Injection',
    cvssScore: 10.0,
    triggerInterface: 'GlobalProtect',
    year: 2024,
    whyItsVulnerable: 'A critical vulnerability exists in the GlobalProtect feature of PAN-OS that allows an unauthenticated attacker to execute arbitrary OS commands with root privileges. This is due to improper sanitization of session data and arbitrary file creation capabilities on the appliance.',
    howToFix: 'Immediately apply the latest security hotfixes for your specific PAN-OS version. Ensure that vulnerability protection profiles are applied to GlobalProtect interfaces. Temporary mitigations involving disabling telemetry have been proven insufficient, so patching is the only complete fix.'
  },
  {
    id: 'CVE-2025-0108',
    name: 'Management Interface Authentication Bypass',
    cvssScore: 7.8,
    triggerInterface: 'Management',
    year: 2025,
    whyItsVulnerable: 'An unauthenticated attacker with network access to the PAN-OS management web interface can bypass authentication checks and invoke specific internal PHP scripts. This occurs because the application fails to adequately restrict access to internal API endpoints.',
    howToFix: 'The most critical remediation is to ensure the Management Web Interface is NEVER exposed to the public internet. Restrict access strictly to trusted internal IP addresses using management interface ACLs. Apply the latest PAN-OS patches that resolve this vulnerability.'
  },
  {
    id: 'CVE-2024-9474',
    name: 'Web Interface Privilege Escalation',
    cvssScore: 6.9,
    triggerInterface: 'Management',
    year: 2024,
    whyItsVulnerable: 'A vulnerability in the PAN-OS management web interface allows an attacker to elevate their privileges and perform actions on the firewall. This is frequently chained with Authentication Bypass vulnerabilities (like CVE-2025-0108) to completely compromise the firewall from the outside.',
    howToFix: 'Restrict access to the Management interface to internal networks only. Patch the firewall to the latest version. Monitor system logs for unexpected configuration changes or administrative logins.'
  },
  {
    id: 'CVE-2025-0111',
    name: 'Management Interface Authenticated File Read',
    cvssScore: 7.5,
    triggerInterface: 'Management',
    year: 2025,
    whyItsVulnerable: 'This vulnerability allows an attacker to read sensitive files from the filesystem of the firewall that are accessible by the "nobody" user. While initially requiring authentication, it becomes highly critical when chained with an authentication bypass (like CVE-2025-0108).',
    howToFix: 'Block public internet access to the Management Web Interface. Restrict management access to trusted IP ranges. Apply the PAN-OS security patch that addresses this file read vulnerability.'
  },
  {
    id: 'CVE-2026-0257',
    name: 'Authentication Bypass in Portal and Gateway',
    cvssScore: 9.8,
    triggerInterface: 'Both',
    year: 2026,
    whyItsVulnerable: 'A critical authentication bypass vulnerability allows unauthenticated attackers to access the portal and gateway components of PAN-OS without supplying valid credentials. This flaw is actively exploited in the wild and can lead to initial network access.',
    howToFix: 'Immediately update your PAN-OS software to the latest release mitigating CVE-2026-0257. If patching is not immediately possible, restrict access to the portal and gateway to known and trusted IP addresses only.'
  },
  {
    id: 'CVE-2026-0273',
    name: 'Authenticated Admin Command Injection',
    cvssScore: 8.8,
    triggerInterface: 'Management',
    year: 2026,
    whyItsVulnerable: 'An authenticated administrator command injection vulnerability exists in the PAN-OS Management Web UI and CLI. It allows an attacker who already has administrative privileges to bypass system restrictions and execute arbitrary commands as the root user on the underlying OS.',
    howToFix: 'Ensure the Management Web Interface is completely isolated from the internet. Enforce strict role-based access control (RBAC) and audit administrator activity. Apply the security patch provided by Palo Alto Networks.'
  },
  {
    id: 'CVE-2026-0300',
    name: 'Captive Portal Buffer Overflow',
    cvssScore: 9.0,
    triggerInterface: 'Management',
    year: 2026,
    whyItsVulnerable: 'A buffer overflow vulnerability exists in the User-ID Authentication Portal (Captive Portal) service. This allows an unauthenticated attacker to execute arbitrary code with root privileges by sending specially crafted input.',
    howToFix: 'If Captive Portal is not required, disable it immediately. Ensure all Management and Portal interfaces are restricted from public internet access. Apply the latest PAN-OS patch.'
  },
  {
    id: 'CVE-2026-0263',
    name: 'IKEv2 Processing Buffer Overflow',
    cvssScore: 8.6,
    triggerInterface: 'Both',
    year: 2026,
    whyItsVulnerable: 'A buffer overflow vulnerability in the Internet Key Exchange version 2 (IKEv2) processing component allows unauthenticated attackers to execute arbitrary code or cause a Denial of Service condition on the firewall.',
    howToFix: 'Apply the vendor patch. If patching is not possible and IPSec VPNs are not actively used, disable IKEv2 processing on external interfaces.'
  },
  {
    id: 'CVE-2026-0262',
    name: 'Network Traffic Denial of Service',
    cvssScore: 7.5,
    triggerInterface: 'Both',
    year: 2026,
    whyItsVulnerable: 'A denial of service (DoS) vulnerability in PAN-OS allows unauthenticated attackers to crash critical services and disrupt network traffic by sending crafted malicious packets to external-facing interfaces.',
    howToFix: 'Apply the latest security updates. Implement robust DoS protection profiles and restrict exposed services using strict firewall rules.'
  },
  {
    id: 'CVE-2024-0012',
    name: 'Management Web Interface Authentication Bypass',
    cvssScore: 9.3,
    triggerInterface: 'Management',
    year: 2024,
    whyItsVulnerable: 'An authentication bypass vulnerability in the PAN-OS management web interface allows an unauthenticated attacker with network access to the management interface to gain administrator privileges.',
    howToFix: 'Ensure that the management web interface is only accessible from trusted internal IP addresses and never exposed to the public internet. Apply the relevant PAN-OS security patch.'
  },
  {
    id: 'CVE-2024-9468',
    name: 'Memory Corruption Denial of Service',
    cvssScore: 8.2,
    triggerInterface: 'Both',
    year: 2024,
    whyItsVulnerable: 'A memory corruption vulnerability allows an unauthenticated attacker to cause a Denial of Service (DoS) condition on the firewall by sending a maliciously crafted packet to a configured interface.',
    howToFix: 'Apply the latest PAN-OS updates. As a temporary mitigation, ensure vulnerability protection profiles are applied to all untrusted interfaces.'
  }
];
