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
    const { stdout: npmOut, stderr: npmErr } = await execPromise('npm install --include=dev');
    console.log('NPM Install Output:', npmOut);
    if (npmErr) console.error('NPM Install Stderr:', npmErr);

    // 3. Handle Docker restart via start.sh
    if (process.env.IS_DOCKER === 'true') {
      console.log('Running npm run build inside Docker...');
      await execPromise('npm run build');

      // Schedule process exit to allow the response to return first.
      // The wrapper script (start.sh) will catch the exit and restart the process.
      setTimeout(() => {
        console.log('Restarting Node process for Docker update...');
        process.exit(0);
      }, 1500);
    }

    return NextResponse.json({ 
      success: true, 
      message: process.env.IS_DOCKER === 'true' ? 'Application updated! Restarting container...' : 'Application updated successfully!',
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
