const { execSync } = require('child_process');
execSync('node scripts/test-buy-again-api.js', { cwd: __dirname + '/server', stdio: 'inherit' });
