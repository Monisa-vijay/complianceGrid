const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      // When Express matches /api, it strips it from req.url
      // So /api/categories/export/ becomes /categories/export/ in pathRewrite
      // We need to add /api back to match Django's URL pattern
      pathRewrite: function (path, req) {
        // path might include query string, so we need to separate it
        // Example: /categories/export/?format=excel -> path part: /categories/export/
        const pathWithoutQuery = path.split('?')[0];
        const rewrittenPath = '/api' + pathWithoutQuery;
        console.log(`[PROXY] Rewriting: ${pathWithoutQuery} -> ${rewrittenPath}`);
        // Return only the path part - query string is handled automatically by http-proxy-middleware
        return rewrittenPath;
      },
      onProxyReq: (proxyReq, req, res) => {
        const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
        const fullUrl = `http://localhost:8000${proxyReq.path}${queryString}`;
        console.log(`[PROXY] Forwarding: ${req.method} ${req.originalUrl || req.url} -> ${fullUrl}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`[PROXY] Response: ${proxyRes.statusCode} for ${req.originalUrl || req.url}`);
      },
      onError: (err, req, res) => {
        console.error(`[PROXY] Error: ${err.message} for ${req.originalUrl || req.url}`);
      },
    })
  );
};
