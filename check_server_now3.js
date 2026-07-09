const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' });
    const nginx = await ssh.execCommand('cat /etc/nginx/sites-available/matmod');
    console.log('matmod nginx:', nginx.stdout);
    
    // the deploy.js of planlayicim might have overwritten /etc/nginx/sites-available/default or we can check what is running.
    // Let's see if planlayicim changed something else.
    
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
run();
