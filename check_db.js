const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const config = { host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' };

async function checkDB() {
    try {
        await ssh.connect(config);
        const curl = await ssh.execCommand('curl http://localhost/api/ideas');
        console.log("DB Content:");
        console.log(curl.stdout);
    } catch (err) {
        console.error(err);
    } finally {
        ssh.dispose();
    }
}
checkDB();
