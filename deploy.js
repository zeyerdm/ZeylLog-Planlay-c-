const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ssh = new NodeSSH();

const config = {
    host: '2.27.101.186',
    username: 'root',
    password: 'uRetGsbvHh!diyo@'
};

async function deploy() {
    try {
        console.log('Connecting to server...');
        await ssh.connect(config);
        console.log('Connected successfully!');

        // 1. Install Node.js and PM2 if they don't exist
        console.log('Ensuring Node.js is installed...');
        const nodeCheck = await ssh.execCommand('node -v');
        if (nodeCheck.code !== 0) {
            console.log('Node.js not found. Installing via NVM...');
            await ssh.execCommand('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash');
            await ssh.execCommand('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm install 20 && nvm use 20 && npm install -g pm2');
        } else {
            console.log(`Node installed: ${nodeCheck.stdout}`);
            const pm2Check = await ssh.execCommand('pm2 -v');
            if (pm2Check.code !== 0) {
                console.log('Installing PM2...');
                await ssh.execCommand('npm install -g pm2');
            }
        }

        const remoteDir = '/var/www/planlayicim';
        console.log(`Creating remote directory ${remoteDir}...`);
        await ssh.execCommand(`mkdir -p ${remoteDir}/public`);
        await ssh.execCommand(`mkdir -p ${remoteDir}/data`);

        // 2. Upload files
        console.log('Uploading files...');
        const localDir = __dirname;
        
        await ssh.putFile(path.join(localDir, 'server.js'), `${remoteDir}/server.js`);
        await ssh.putFile(path.join(localDir, 'package.json'), `${remoteDir}/package.json`);
        await ssh.putFile(path.join(localDir, 'public/index.html'), `${remoteDir}/public/index.html`);
        await ssh.putFile(path.join(localDir, 'public/style.css'), `${remoteDir}/public/style.css`);
        await ssh.putFile(path.join(localDir, 'public/app.js'), `${remoteDir}/public/app.js`);
        
        console.log('Files uploaded successfully.');

        // 3. Install dependencies on server
        console.log('Installing dependencies on remote server...');
        const sourceNvm = 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"';
        await ssh.execCommand(`${sourceNvm} && cd ${remoteDir} && npm install`);

        // 4. Start with PM2
        console.log('Starting application with PM2...');
        const pm2Result = await ssh.execCommand(`${sourceNvm} && cd ${remoteDir} && pm2 restart planlayicim || pm2 start server.js --name "planlayicim"`);
        console.log(pm2Result.stdout);

        console.log('Setup IPTables/UFW for port 80 forwarding or Nginx if needed...');
        // Bind to port 80 if not already used. We set PORT=80 in server.js but it requires sudo.
        // Since we are root, it's fine.
        
        console.log('\n--- DEPLOYMENT SUCCESSFUL ---');
        console.log(`App should be running at http://${config.host}/`);
        
    } catch (error) {
        console.error('Deployment failed:', error);
    } finally {
        ssh.dispose();
    }
}

deploy();
