const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
  try {
    await ssh.connect({ host: '2.27.101.186', username: 'root', password: 'uRetGsbvHh!diyo@' });
    
    // 1. Change PM2 port for planlayicim to 3000 and restart
    const sourceNvm = 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"';
    
    // First, let's stop and delete the old pm2 process just to be safe
    await ssh.execCommand(sourceNvm + ' && pm2 delete planlayicim');
    
    // Start with PORT=3000
    const pm2Start = await ssh.execCommand(sourceNvm + ' && cd /var/www/planlayicim && PORT=3000 pm2 start server.js --name planlayicim');
    console.log('PM2 Start:', pm2Start.stdout);
    
    // 2. Modify app.js on the server to use /planlayici/api
    const sedCmd = "sed -i \"s|const API_URL = '/api';|const API_URL = '/planlayici/api';|g\" /var/www/planlayicim/public/app.js";
    await ssh.execCommand(sedCmd);
    console.log('app.js modified.');
    
    // 3. Update Nginx configuration
    // We will read the config, insert the new location block before the first 'listen 443' or at the end of the server block
    const nginxConf = await ssh.execCommand('cat /etc/nginx/sites-available/matmod');
    let confStr = nginxConf.stdout;
    
    if (!confStr.includes('location /planlayici/')) {
        const insertBlock = `
    location /planlayici/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
`;
        // Insert before 'listen 443 ssl;'
        confStr = confStr.replace('listen 443 ssl;', insertBlock + '\n    listen 443 ssl;');
        
        // Write the new config
        // Using base64 to avoid escaping issues
        const b64 = Buffer.from(confStr).toString('base64');
        await ssh.execCommand(`echo ${b64} | base64 -d > /etc/nginx/sites-available/matmod`);
        console.log('Nginx config updated.');
        
        // 4. Test Nginx and reload
        const nginxTest = await ssh.execCommand('nginx -t');
        console.log('Nginx test:', nginxTest.stderr); // nginx -t writes to stderr
        if (nginxTest.stderr.includes('successful')) {
            const nginxReload = await ssh.execCommand('systemctl reload nginx');
            console.log('Nginx reloaded.');
        } else {
            console.error('Nginx test failed!');
        }
    } else {
        console.log('Location /planlayici/ already exists in config.');
    }
    
    ssh.dispose();
  } catch(e) {
    console.error(e);
  }
}
run();
