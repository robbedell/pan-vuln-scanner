export interface Vulnerability {
  id: string;
  name: string;
  cvssScore: number;
  triggerInterface: 'GlobalProtect' | 'Management' | 'Both';
  year: number;
  whyItsVulnerable: string;
  howToFix: string;
  affectedVersions: string;
  rootCause: string;
  testSetup: string;
}

export const cveDatabase: Vulnerability[] = [
  {
    id: 'CVE-2024-3400',
    name: 'GlobalProtect OS Command Injection',
    cvssScore: 10.0,
    triggerInterface: 'GlobalProtect',
    year: 2024,
    whyItsVulnerable: 'A critical vulnerability exists in the GlobalProtect feature of PAN-OS that allows an unauthenticated attacker to execute arbitrary OS commands with root privileges. This is due to improper sanitization of session data and arbitrary file creation capabilities on the appliance.',
    howToFix: 'Immediately apply the latest security hotfixes for your specific PAN-OS version. Ensure that vulnerability protection profiles are applied to GlobalProtect interfaces. Temporary mitigations involving disabling telemetry have been proven insufficient, so patching is the only complete fix.',
    affectedVersions: 'PAN-OS < 11.1.2-h3, < 11.0.4-h1, < 10.2.9-h1',
    rootCause: 'The firewall fails to properly sanitize the `SESSID` (session ID) cookie. An attacker can use path traversal techniques (`../../../`) inside the `SESSID` to create a 0-byte file anywhere on the filesystem. By dropping an empty file named with shell metacharacters (e.g. `` `whoami` ``) into the `/opt/panlogs/tmp/device_telemetry/hour/` directory, a background telemetry processing daemon will blindly execute the filename as a shell command with root privileges.',
    testSetup: '1. Deploy a vulnerable PAN-OS firmware version (e.g. 10.2.9 or older).\n2. Navigate to Network > GlobalProtect > Gateways or Portals.\n3. Create a Gateway and bind it to an external-facing interface with a public/routable IP.\n4. Commit the configuration. (Note: Device Telemetry does NOT need to be enabled for this to be exploitable; simply exposing the GP portal exposes the vulnerable SESSID parser).\n5. CRITICAL OAST REQUIREMENT: For automated scanners to confirm this blind OS command injection, the firewall must have outbound DNS and HTTP/S access to resolve and callback to the scanner\'s interact.sh/OAST payload. An isolated air-gapped lab will result in false negatives.'
  },
  {
    id: 'CVE-2025-0108',
    name: 'Management Interface Authentication Bypass',
    cvssScore: 7.8,
    triggerInterface: 'Management',
    year: 2025,
    whyItsVulnerable: 'An unauthenticated attacker with network access to the PAN-OS management web interface can bypass authentication checks and invoke specific internal PHP scripts. This occurs because the application fails to adequately restrict access to internal API endpoints.',
    howToFix: 'The most critical remediation is to ensure the Management Web Interface is NEVER exposed to the public internet. Restrict access strictly to trusted internal IP addresses using management interface ACLs. Apply the latest PAN-OS patches that resolve this vulnerability.',
    affectedVersions: 'PAN-OS < 11.2.4-h4, < 11.1.6-h1, < 10.2.13-h3, < 10.1.14-h9',
    rootCause: 'The management web server (nginx/php-fpm) uses a custom authentication middleware. By manipulating specific HTTP request headers (like `X-PAN-AUTHCHECK`) and manipulating URI paths, an unauthenticated request can trick the middleware into believing the session has already been validated, granting access to restricted internal `.php` scripts designed only for local loopback execution.',
    testSetup: '1. Deploy a vulnerable PAN-OS version.\n2. Navigate to Device > Setup > Management.\n3. Under "Management Interface Settings", ensure HTTPS is enabled.\n4. Ensure the Management interface is reachable from the network where your scanner resides (no restrictive ACLs applied).'
  },
  {
    id: 'CVE-2024-9474',
    name: 'Web Interface Privilege Escalation',
    cvssScore: 6.9,
    triggerInterface: 'Management',
    year: 2024,
    whyItsVulnerable: 'A vulnerability in the PAN-OS management web interface allows an attacker to elevate their privileges and perform actions on the firewall. This is frequently chained with Authentication Bypass vulnerabilities (like CVE-2025-0108) to completely compromise the firewall from the outside.',
    howToFix: 'Restrict access to the Management interface to internal networks only. Patch the firewall to the latest version. Monitor system logs for unexpected configuration changes or administrative logins.',
    affectedVersions: 'PAN-OS < 11.2.4-h1, < 11.1.5-h1, < 11.0.6-h1, < 10.2.12-h2, < 10.1.14-h6',
    rootCause: 'An administrative PHP script accessible via the management interface improperly validates the role of the user invoking it. When chained with an authentication bypass (CVE-2024-0012 or CVE-2025-0108), the script allows a low-privileged or unauthenticated session context to modify system configurations by injecting unsanitized XML directly into the `panxapi.php` handler, effectively granting root/superuser rights.',
    testSetup: '1. Deploy a vulnerable PAN-OS firmware.\n2. Ensure the Management web interface is exposed and reachable.\n3. Create a low-privileged read-only admin account (if testing privilege escalation independently without an auth bypass chain).'
  },
  {
    id: 'CVE-2025-0111',
    name: 'Management Interface Authenticated File Read',
    cvssScore: 7.5,
    triggerInterface: 'Management',
    year: 2025,
    whyItsVulnerable: 'This vulnerability allows an attacker to read sensitive files from the filesystem of the firewall that are accessible by the "nobody" user. While initially requiring authentication, it becomes highly critical when chained with an authentication bypass (like CVE-2025-0108).',
    howToFix: 'Block public internet access to the Management Web Interface. Restrict management access to trusted IP ranges. Apply the PAN-OS security patch that addresses this file read vulnerability.',
    affectedVersions: 'PAN-OS < 11.2.4-h4, < 11.1.6-h1, < 10.2.13-h3, < 10.1.14-h9',
    rootCause: 'A specific logging export endpoint in the management web interface accepts a filename parameter without properly sanitizing directory traversal characters (`../`). Because the web server process runs as the `nobody` user, an attacker can use this endpoint to read any file on the underlying Linux filesystem that is readable by `nobody` (e.g., `/etc/passwd` or specific cached configuration backups).',
    testSetup: '1. Deploy a vulnerable PAN-OS firmware.\n2. Expose the Management interface on port 443.\n3. Log in with an authenticated user, or chain with CVE-2025-0108 to test unauthenticated file read capabilities.'
  },
  {
    id: 'CVE-2026-0257',
    name: 'Authentication Bypass in Portal and Gateway',
    cvssScore: 9.8,
    triggerInterface: 'Both',
    year: 2026,
    whyItsVulnerable: 'A critical authentication bypass vulnerability allows unauthenticated attackers to access the portal and gateway components of PAN-OS without supplying valid credentials. This flaw is actively exploited in the wild and can lead to initial network access.',
    howToFix: 'Immediately update your PAN-OS software to the latest release mitigating CVE-2026-0257. If patching is not immediately possible, restrict access to the portal and gateway to known and trusted IP addresses only.',
    affectedVersions: 'PAN-OS < 11.2.6-h1, < 11.1.8-h2, < 10.2.15-h1',
    rootCause: 'The vulnerability resides in the SAML/SSO parsing logic of the GlobalProtect daemon. When processing a maliciously malformed XML Signature in an SSO assertion, the daemon throws an exception that fails open rather than failing closed. This generates a valid session token for the attacker without requiring the Identity Provider (IdP) to actually sign the assertion.',
    testSetup: '1. Deploy a vulnerable legacy PAN-OS version.\n2. Configure a GlobalProtect Gateway on an external interface.\n3. Under Authentication, configure a SAML Identity Provider profile. (The IdP does not need to be functional; merely having the SAML XML parser active exposes the flaw).'
  },
  {
    id: 'CVE-2026-0273',
    name: 'Authenticated Admin Command Injection',
    cvssScore: 8.8,
    triggerInterface: 'Management',
    year: 2026,
    whyItsVulnerable: 'An authenticated administrator command injection vulnerability exists in the PAN-OS Management Web UI and CLI. It allows an attacker who already has administrative privileges to bypass system restrictions and execute arbitrary commands as the root user on the underlying OS.',
    howToFix: 'Ensure the Management Web Interface is completely isolated from the internet. Enforce strict role-based access control (RBAC) and audit administrator activity. Apply the security patch provided by Palo Alto Networks.',
    affectedVersions: 'PAN-OS < 11.2.6-h1, < 11.1.8-h2, < 10.2.15-h1',
    rootCause: 'A diagnostic ping/traceroute wrapper utility in the web interface and CLI fails to sanitize input. When an administrator inputs a target IP address formatted as `127.0.0.1; rm -rf /`, the underlying system shell interprets the semicolon and executes the appended command as root, breaking out of the restricted PAN-OS CLI jail.',
    testSetup: '1. Deploy a vulnerable PAN-OS version.\n2. Expose the Management interface.\n3. Ensure you have an administrator account with access to network diagnostic tools (Ping/Traceroute) to reproduce the injection.\n4. CRITICAL OAST REQUIREMENT: As this is a blind command injection, ensure the management interface has outbound DNS and ICMP/HTTP routing capabilities so the callback payload can successfully reach the scanner\'s OAST server.'
  },
  {
    id: 'CVE-2026-0300',
    name: 'Captive Portal Buffer Overflow',
    cvssScore: 9.0,
    triggerInterface: 'Management',
    year: 2026,
    whyItsVulnerable: 'A buffer overflow vulnerability exists in the User-ID Authentication Portal (Captive Portal) service. This allows an unauthenticated attacker to execute arbitrary code with root privileges by sending specially crafted input.',
    howToFix: 'If Captive Portal is not required, disable it immediately. Ensure all Management and Portal interfaces are restricted from public internet access. Apply the latest PAN-OS patch.',
    affectedVersions: 'PAN-OS < 11.2.6-h2, < 11.1.9-h1',
    rootCause: 'The `userid-portal` daemon statically allocates a buffer for processing the `User-Agent` HTTP header during the initial Captive Portal redirect. By sending a massive `User-Agent` string exceeding 4096 bytes, an attacker overwrites the return pointer on the stack, allowing them to redirect execution flow to a malicious ROP chain and execute shellcode.',
    testSetup: '1. Deploy a vulnerable PAN-OS firmware.\n2. Navigate to Network > Interfaces and enable an interface.\n3. Navigate to Device > User Identification > Captive Portal and enable the Captive Portal service, binding it to the exposed interface.\n4. CRITICAL OAST REQUIREMENT: If validating RCE via shellcode callbacks, the firewall data plane must have outbound routing to the scanner\'s OAST domain.'
  },
  {
    id: 'CVE-2026-0263',
    name: 'IKEv2 Processing Buffer Overflow',
    cvssScore: 8.6,
    triggerInterface: 'Both',
    year: 2026,
    whyItsVulnerable: 'A buffer overflow vulnerability in the Internet Key Exchange version 2 (IKEv2) processing component allows unauthenticated attackers to execute arbitrary code or cause a Denial of Service condition on the firewall.',
    howToFix: 'Apply the vendor patch. If patching is not possible and IPSec VPNs are not actively used, disable IKEv2 processing on external interfaces.',
    affectedVersions: 'PAN-OS < 11.2.6-h1, < 11.1.8-h2, < 10.2.15-h1',
    rootCause: 'The `ikemgr` daemon mishandles deeply nested IKEv2 payload structures. When an attacker sends a crafted IKEv2 `SA_INIT` packet with recursively nested Transform payloads, the parser exhausts its heap allocation, overflowing into adjacent memory structures and crashing the daemon (DoS) or potentially leading to remote code execution.',
    testSetup: '1. Deploy a vulnerable PAN-OS firmware.\n2. Navigate to Network > IPSec Crypto Profiles and create a profile.\n3. Navigate to Network > IKE Gateways and enable an IKEv2 gateway on an external-facing interface (UDP port 500).'
  },
  {
    id: 'CVE-2026-0262',
    name: 'Network Traffic Denial of Service',
    cvssScore: 7.5,
    triggerInterface: 'Both',
    year: 2026,
    whyItsVulnerable: 'A denial of service (DoS) vulnerability in PAN-OS allows unauthenticated attackers to crash critical services and disrupt network traffic by sending crafted malicious packets to external-facing interfaces.',
    howToFix: 'Apply the latest security updates. Implement robust DoS protection profiles and restrict exposed services using strict firewall rules.',
    affectedVersions: 'PAN-OS < 11.2.6-h1, < 11.1.8-h2, < 10.2.15-h1',
    rootCause: 'The PAN-OS App-ID engine contains a null pointer dereference vulnerability when attempting to reassemble heavily fragmented, out-of-order TCP packets that mimic a specific obscure protocol signature. Processing these packets causes the data plane core to fault and restart, dropping all active network traffic temporarily.',
    testSetup: '1. Deploy a vulnerable PAN-OS firmware.\n2. Ensure the firewall is actively routing traffic on an external interface.\n3. Ensure App-ID is enabled on the security policies applying to that interface.'
  },
  {
    id: 'CVE-2024-0012',
    name: 'Management Web Interface Authentication Bypass',
    cvssScore: 9.3,
    triggerInterface: 'Management',
    year: 2024,
    whyItsVulnerable: 'An authentication bypass vulnerability in the PAN-OS management web interface allows an unauthenticated attacker with network access to the management interface to gain administrator privileges.',
    howToFix: 'Ensure that the management web interface is only accessible from trusted internal IP addresses and never exposed to the public internet. Apply the relevant PAN-OS security patch.',
    affectedVersions: 'PAN-OS < 11.2.4-h1, < 11.1.5-h1, < 11.0.6-h1, < 10.2.12-h2',
    rootCause: 'A configuration error in the management web server allows an attacker to spoof their IP address using the `X-Forwarded-For` header. When combined with specific URI paths that are mistakenly allowlisted by the internal Nginx configuration for loopback access, the server grants unauthenticated administrative API access to the external request.',
    testSetup: '1. Deploy a vulnerable PAN-OS firmware (e.g. 11.0.5).\n2. Expose the Management interface on port 443 to a reachable network.\n3. The vulnerability does not require any specific feature beyond the default management web server running.'
  },
  {
    id: 'CVE-2024-9468',
    name: 'Memory Corruption Denial of Service',
    cvssScore: 8.2,
    triggerInterface: 'Both',
    year: 2024,
    whyItsVulnerable: 'A memory corruption vulnerability allows an unauthenticated attacker to cause a Denial of Service (DoS) condition on the firewall by sending a maliciously crafted packet to a configured interface.',
    howToFix: 'Apply the latest PAN-OS updates. As a temporary mitigation, ensure vulnerability protection profiles are applied to all untrusted interfaces.',
    affectedVersions: 'PAN-OS < 11.1.4-h1, < 11.0.5-h2, < 10.2.11-h1',
    rootCause: 'An integer underflow vulnerability exists in the data plane packet processing module when parsing malformed IPv6 extension headers. This results in a massive memory copy operation that overwrites kernel memory boundaries, triggering an immediate kernel panic and reboot of the firewall data plane.',
    testSetup: '1. Deploy a vulnerable PAN-OS firmware.\n2. Configure an external interface with IPv6 addressing enabled.\n3. Ensure the firewall is actively routing IPv6 traffic.'
  }
];
