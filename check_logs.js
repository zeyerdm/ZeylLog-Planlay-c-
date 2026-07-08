const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const config = { host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' };
const sourceNvm = 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"';

async function check() {
    try {
        await ssh.connect(config);
        const logs = await ssh.execCommand(`${sourceNvm} && pm2 logs planlayicim --lines 30 --nostream`);
        console.log(logs.stdout);
        console.log(logs.stderr);
    } catch (err) { console.error(err); } finally { ssh.dispose(); }
}
check();
