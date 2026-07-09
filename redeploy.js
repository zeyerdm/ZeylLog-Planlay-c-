const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();
const config = { host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' };
const remoteDir = '/var/www/planlayicim';
const sourceNvm = 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"';

async function push() {
    try {
        await ssh.connect(config);
        console.log("Uploading files...");
        
        await ssh.putFile(path.join(__dirname, 'public/index.html'), `${remoteDir}/public/index.html`);
        await ssh.putFile(path.join(__dirname, 'public/planner.html'), `${remoteDir}/public/planner.html`);
        await ssh.putFile(path.join(__dirname, 'public/style.css'), `${remoteDir}/public/style.css`);
        await ssh.putFile(path.join(__dirname, 'public/app.js'), `${remoteDir}/public/app.js`);
        await ssh.putFile(path.join(__dirname, 'public/clock.css'), `${remoteDir}/public/clock.css`);
        await ssh.putFile(path.join(__dirname, 'public/clock.js'), `${remoteDir}/public/clock.js`);
        await ssh.putFile(path.join(__dirname, 'server.js'), `${remoteDir}/server.js`);
        
        console.log("Restarting PM2...");
        const res = await ssh.execCommand(`${sourceNvm} && pm2 restart planlayicim`);
        console.log(res.stdout);
        
        console.log("Done! Site live at http://2.27.101.186");
    } catch (err) {
        console.error(err);
    } finally {
        ssh.dispose();
    }
}
push();
