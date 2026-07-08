const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();
const config = {
    host: '2.27.101.186',
    username: 'root',
    password: 'uRetGsbvHh!diyo@'
};

async function check() {
    try {
        await ssh.connect(config);
        
        console.log("--- PM2 STATUS ---");
        const pm2 = await ssh.execCommand('pm2 status');
        console.log(pm2.stdout);
        
        console.log("--- PM2 LOGS ---");
        const logs = await ssh.execCommand('pm2 logs planlayicim --lines 20 --nostream');
        console.log(logs.stdout);
        console.log(logs.stderr);
        
        console.log("--- CURL LOCALHOST ---");
        const curl = await ssh.execCommand('curl -I http://localhost');
        console.log(curl.stdout);
        
        console.log("--- FIREWALL UFW ---");
        const ufw = await ssh.execCommand('ufw status');
        console.log(ufw.stdout);
        
    } catch (err) {
        console.error(err);
    } finally {
        ssh.dispose();
    }
}

check();
