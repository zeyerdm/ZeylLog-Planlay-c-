const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const config = { host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' };

async function fix() {
    try {
        await ssh.connect(config);
        
        console.log("Stopping nginx...");
        await ssh.execCommand('systemctl stop nginx');
        await ssh.execCommand('systemctl disable nginx');
        
        console.log("Starting PM2 app...");
        const sourceNvm = 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"';
        const res = await ssh.execCommand(`${sourceNvm} && cd /var/www/planlayicim && pm2 restart planlayicim || pm2 start server.js --name "planlayicim"`);
        console.log(res.stdout);
        
        const logs = await ssh.execCommand(`${sourceNvm} && pm2 logs planlayicim --lines 20 --nostream`);
        console.log(logs.stdout);
        console.log(logs.stderr);
        
        const curl = await ssh.execCommand('curl -I http://localhost');
        console.log(curl.stdout);
        
    } catch (err) {
        console.error(err);
    } finally {
        ssh.dispose();
    }
}
fix();
