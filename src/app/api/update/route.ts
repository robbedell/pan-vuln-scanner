import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST() {
  try {
    // 1. Pull the latest code from GitHub
    console.log('Running git pull origin main...');
    const { stdout: gitOut, stderr: gitErr } = await execPromise('git pull origin main');
    console.log('Git Pull Output:', gitOut);
    if (gitErr) console.error('Git Pull Stderr:', gitErr);

    // 2. Install any new dependencies if package.json changed
    console.log('Running npm install...');
    const { stdout: npmOut, stderr: npmErr } = await execPromise('npm install');
    console.log('NPM Install Output:', npmOut);
    if (npmErr) console.error('NPM Install Stderr:', npmErr);

    // Note: Next.js 'npm run dev' automatically hot reloads file changes.
    // However, if structural dependencies or next.config.js changed, the process
    // may need a manual restart by the user. For standard updates, HMR is sufficient.

    return NextResponse.json({ 
      success: true, 
      message: 'Application updated successfully!',
      details: gitOut 
    });
  } catch (error: any) {
    console.error('Update Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update application',
      details: error.message
    }, { status: 500 });
  }
}
