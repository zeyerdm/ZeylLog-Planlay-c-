const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();
const config = { host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' };

async function updateUI() {
    try {
        await ssh.connect(config);
        
        console.log("Uploading index.html and style.css...");
        await ssh.putFile(path.join(__dirname, 'public/index.html'), '/var/www/planlayicim/public/index.html');
        await ssh.putFile(path.join(__dirname, 'public/style.css'), '/var/www/planlayicim/public/style.css');
        
        console.log("UI updated!");
        
    } catch (err) {
        console.error(err);
    } finally {
        ssh.dispose();
    }
}
updateUI();
