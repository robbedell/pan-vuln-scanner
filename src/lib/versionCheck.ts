export function isVersionVulnerable(userVersion: string, affectedString: string): boolean {
  if (!userVersion || !affectedString) return false;
  
  // Extract major.minor from userVersion
  // e.g. "11.1.2-h3" -> track "11.1"
  const match = userVersion.match(/^(\d+\.\d+)\.(\d+)(?:-h(\d+))?/);
  if (!match) return false;
  
  const [, uMajorMinor, uPatch, uHotfixStr] = match;
  const uPatchNum = parseInt(uPatch, 10);
  const uHotfixNum = uHotfixStr ? parseInt(uHotfixStr, 10) : 0;

  // Look for the same track in affectedString
  // e.g. "< 11.1.5-h1"
  // Escape the period in major.minor
  const safeMajorMinor = uMajorMinor.replace('.', '\\.');
  const regex = new RegExp(`<\\s*${safeMajorMinor}\\.(\\d+)(?:-h(\\d+))?`);
  const boundMatch = affectedString.match(regex);
  
  if (!boundMatch) {
    // If the specific major.minor track is not listed, we assume it's not vulnerable to this CVE.
    return false;
  }
  
  const [, bPatch, bHotfixStr] = boundMatch;
  const bPatchNum = parseInt(bPatch, 10);
  const bHotfixNum = bHotfixStr ? parseInt(bHotfixStr, 10) : 0;

  if (uPatchNum < bPatchNum) return true;
  if (uPatchNum === bPatchNum && uHotfixNum < bHotfixNum) return true;
  
  return false;
}
