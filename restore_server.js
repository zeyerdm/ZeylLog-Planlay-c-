const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' });
    
    // Stop planlayicim in pm2
    const sourceNvm = 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"';
    const pm2Stop = await ssh.execCommand(sourceNvm + ' && pm2 stop planlayicim');
    console.log('PM2 stop:', pm2Stop.stdout);
    
    // Start nginx
    const nginxStart = await ssh.execCommand('systemctl start nginx');
    console.log('Nginx start output:', nginxStart.stdout);
    console.log('Nginx start err:', nginxStart.stderr);
    
    const nginxStatus = await ssh.execCommand('systemctl status nginx --no-pager');
    console.log('Nginx status:', nginxStatus.stdout);
    
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
run();
