const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' });
    const nginxStatus = await ssh.execCommand('systemctl status nginx --no-pager');
    console.log('Nginx status:', nginxStatus.stdout);
    console.log('Nginx stderr:', nginxStatus.stderr);
    
    const pm2Logs = await ssh.execCommand('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && pm2 logs planlayicim --lines 20 --nostream');
    console.log('PM2 logs:', pm2Logs.stdout);
    
    const matmodStatus = await ssh.execCommand('systemctl status matmod --no-pager');
    console.log('Matmod status:', matmodStatus.stdout);
    console.log('Matmod stderr:', matmodStatus.stderr);
    
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
run();
