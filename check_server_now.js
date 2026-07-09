const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' });
    const sourceNvm = 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"';
    const pm2 = await ssh.execCommand(sourceNvm + ' && pm2 list');
    console.log('PM2:', pm2.stdout);
    const netstat = await ssh.execCommand('netstat -tulnp | grep 80');
    console.log('Netstat 80:', netstat.stdout);
    const nginx = await ssh.execCommand('cat /etc/nginx/sites-enabled/default');
    console.log('Nginx config:', nginx.stdout);
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
run();
