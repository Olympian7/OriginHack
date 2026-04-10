const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const HttpError = require('../utils/http-error');
const logger = require('../utils/logger');
const siteData = require('../data/site-data');

function resolvePythonCommand(scriptDir) {
  const customCommand = (process.env.PYTHON_COMMAND || '').trim();
  if (customCommand) {
    return customCommand;
  }

  const workspaceVenvPython = path.resolve(
    scriptDir,
    '..',
    '..',
    '..',
    '..',
    '.venv',
    'Scripts',
    'python.exe'
  );

  if (fs.existsSync(workspaceVenvPython)) {
    return workspaceVenvPython;
  }

  return 'python';
}

function triggerCallScript(req, res, next) {
  const scriptDir = path.resolve(__dirname, '..', '..', '..', 'Telephony', 'Telephony');
  const scriptName = 'call_trigger.py';
  const pythonCommand = resolvePythonCommand(scriptDir);

  logger.info('Triggering Python call script', {
    script: scriptName,
    pythonCommand
  });

  const child = spawn(pythonCommand, [scriptName], {
    cwd: scriptDir,
    windowsHide: true
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('error', (error) => {
    siteData.registerCallTrigger({
      success: false,
      errorMessage: error.message
    });

    next(new HttpError(500, `Failed to launch call trigger: ${error.message}`));
  });

  child.on('close', (code) => {
    const combinedOutput = [stderr.trim(), stdout.trim()].filter(Boolean).join('\n');

    if (code !== 0) {
      siteData.registerCallTrigger({
        success: false,
        errorMessage: combinedOutput || `call trigger exited with code ${code}`
      });

      return next(
        new HttpError(500, combinedOutput || `call trigger exited with code ${code}`)
      );
    }

    const callSidMatch = stdout.match(/Call SID:\s*(.+)/i);
    const callSid = callSidMatch ? callSidMatch[1].trim() : null;

    siteData.registerCallTrigger({
      success: true,
      callSid
    });

    const snapshot = siteData.getState();

    return res.json({
      success: true,
      message: 'Call trigger executed successfully',
      callSid,
      output: stdout.trim(),
      metrics: snapshot.analytics,
      dashboard: snapshot.dashboard
    });
  });
}

module.exports = {
  triggerCallScript
};