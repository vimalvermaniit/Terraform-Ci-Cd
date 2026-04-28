const http = require('http');
const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
  } else if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>AKS CI/CD Deployment</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .container { max-width: 800px; margin: 0 auto; background: rgba(0,0,0,0.3); padding: 30px; border-radius: 10px; }
    h1 { margin: 0; }
    .info { background: rgba(255,255,255,0.1); padding: 15px; margin: 20px 0; border-radius: 5px; }
    code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px; }
    .status { color: #4ade80; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ Hello from AKS via GitHub Actions CI/CD!</h1>
    <div class="info">
      <p><strong>Deployment Status:</strong> <span class="status">Running</span></p>
      <p><strong>Environment:</strong> production</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>Node Version:</strong> ${process.version}</p>
      <p><strong>Platform:</strong> ${process.platform} (${process.arch})</p>
    </div>
    <div class="info">
      <h3>CI/CD Pipeline Flow:</h3>
      <ol>
        <li>Developer pushes code to GitHub main branch</li>
        <li>GitHub Actions workflow triggers automatically</li>
        <li>Docker image is built and pushed to Azure Container Registry (ACR)</li>
        <li>AKS cluster pulls image and deploys pods</li>
        <li>Kubernetes Service (LoadBalancer) exposes app to public internet</li>
      </ol>
    </div>
    <div class="info">
      <p><strong>Access Points:</strong></p>
      <ul>
        <li>Health check: <code>/health</code></li>
        <li>Home page: <code>/</code></li>
        <li>Public URL: <code>http://[LoadBalancer-PublicIP]:80</code></li>
      </ul>
    </div>
  </div>
</body>
</html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
