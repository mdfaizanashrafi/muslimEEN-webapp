# MuslimEEN Deployment Instructions

## Prerequisites

- Web server (Nginx, Apache, or CDN)
- SSL certificate (required for biometric authentication)
- Domain name
- Minimum server specs: 1 CPU, 512MB RAM (static hosting)

## Static Hosting Deployment

### Option 1: Nginx

```nginx
server {
    listen 80;
    server_name muslimeen.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name muslimeen.org;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/muslimeen;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 2: Apache

```apache
<VirtualHost *:80>
    ServerName muslimeen.org
    Redirect permanent / https://muslimeen.org/
</VirtualHost>

<VirtualHost *:443>
    ServerName muslimeen.org
    DocumentRoot /var/www/muslimeen

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    # Enable compression
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \
            \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \
            \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>

    # Cache static assets
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
    </IfModule>

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # SPA routing
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </IfModule>
</VirtualHost>
```

### Option 3: Cloudflare Pages (Recommended)

1. Push code to GitHub/GitLab
2. Connect repository to Cloudflare Pages
3. Set build command: `echo "No build needed"`
4. Set output directory: `/`
5. Enable "Always use HTTPS"

### Option 4: Netlify

```toml
# netlify.toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Performance Optimization

### 1. Enable Brotli Compression

```nginx
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/javascript application/json;
```

### 2. Preconnect to External Resources

Add to HTML `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

### 3. Preload Critical Resources

```html
<link rel="preload" href="css/design-system.css" as="style">
<link rel="preload" href="js/app.js" as="script">
```

### 4. Lazy Load Non-Critical Content

```html
<img loading="lazy" src="..." alt="...">
```

## CDN Configuration

### Cloudflare

1. Enable Auto Minify (HTML, CSS, JS)
2. Enable Brotli compression
3. Set Browser Cache TTL: 1 year for static assets
4. Enable HTTP/2 and HTTP/3
5. Enable Early Hints

### AWS CloudFront

```json
{
  "Comment": "MuslimEEN CDN",
  "Origins": [
    {
      "Id": "S3-muslimeen",
      "DomainName": "muslimeen.s3.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": ""
      }
    }
  ],
  "DefaultCacheBehavior": {
    "ViewerProtocolPolicy": "redirect-to-https",
    "Compress": true,
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  }
}
```

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] HSTS header configured
- [ ] Security headers (X-Frame-Options, CSP, etc.)
- [ ] CORS properly configured for API
- [ ] Rate limiting enabled
- [ ] DDoS protection enabled
- [ ] Regular security audits

## Monitoring

### Recommended Tools
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: Lighthouse CI, WebPageTest
- **Analytics**: Plausible (privacy-focused), Matomo
- **Error Tracking**: Sentry

### Key Metrics to Monitor
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)
- API response times
- Error rates

## Backup Strategy

1. **Code**: Git repository (GitHub/GitLab)
2. **User Data**: Daily database backups
3. **Static Assets**: Versioned in Git + CDN

## Rollback Procedure

1. Revert to previous Git commit
2. Purge CDN cache
3. Verify rollback success
4. Monitor for issues

## Environment Variables

Create `.env` file for different environments:

```bash
# Production
API_BASE_URL=https://api.muslimeen.org/v1
ENVIRONMENT=production

# Staging
API_BASE_URL=https://api-staging.muslimeen.org/v1
ENVIRONMENT=staging

# Development
API_BASE_URL=http://localhost:3000/v1
ENVIRONMENT=development
```

## Testing Before Deployment

### Checklist
- [ ] All pages load correctly
- [ ] Navigation works
- [ ] Forms submit properly
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Accessibility audit passes
- [ ] Performance budget met
- [ ] Security headers present
- [ ] SSL certificate valid

### Lighthouse Targets
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

## Troubleshooting

### Common Issues

**404 on page refresh (SPA)**
- Configure server to serve index.html for all routes

**CSS not loading**
- Check MIME types are correct
- Verify file paths

**API calls failing**
- Check CORS configuration
- Verify API base URL

**Slow load times**
- Enable compression
- Check cache headers
- Optimize images

## Support

For deployment issues, contact:
- Technical Team: tech@muslimeen.org
- Community Forum: https://community.muslimeen.org
