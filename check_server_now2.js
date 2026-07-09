const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' });
    const ls = await ssh.execCommand('ls -la /var/www/matmod');
    console.log('matmod files:', ls.stdout);
    
    // Check if there is a PM2 process for matmod
    const sourceNvm = 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"';
    const pm2 = await ssh.execCommand(sourceNvm + ' && pm2 describe matmod');
    console.log('PM2 matmod:', pm2.stdout);
    
    const nginx = await ssh.execCommand('ls -la /etc/nginx/sites-enabled');
    console.log('nginx sites:', nginx.stdout);
    
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
run();
