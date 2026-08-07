# Setup Production Maintenance Mode (Avoid 502 Bad Gateway)

During builds (`npm run build`), installation of dependencies, or service restarts, Next.js goes offline. This causes Nginx to return a raw **502 Bad Gateway** error page.

By setting up this configuration, Nginx will automatically serve the beautiful, animated **Dhanpuri Public School** maintenance page directly from the disk. The page has an **auto-refresh script** that polls the server in the background and automatically reloads the page for the user as soon as the site is back online!

---

## 1. Nginx Configuration

Open your Nginx site configuration file (typically at `/etc/nginx/sites-available/default` or similar):

```bash
sudo nano /etc/nginx/sites-available/default
```

Locate your `server` block and update it as follows:

```nginx
server {
    listen 80;
    server_name yourdomain.com; # Replace with your actual domain

    # The absolute path to your Next.js public directory
    root /home/ubuntu/school_platform_project/public;

    # Define custom error page for 502 / 503 / 504
    error_page 502 503 504 /maintenance.html;

    # Reverse proxy configuration
    location / {
        proxy_pass http://localhost:3000; # Points to Next.js server
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve the maintenance page directly from the root path if it is triggered
    location = /maintenance.html {
        internal;
    }

    # Serve static assets directly from Nginx (improves performance during maintenance)
    location /_next/static {
        alias /home/ubuntu/school_platform_project/.next/static;
        expires 365d;
        access_log off;
    }
}
```

> [!NOTE]
> Make sure to replace `/home/ubuntu/school_platform_project` with the **absolute path** to your workspace folder on the production server.

---

## 2. Test and Reload Nginx

After updating the configuration file, test the Nginx configuration for syntax errors:

```bash
sudo nginx -t
```

If it reports success, reload Nginx to apply the changes:

```bash
sudo systemctl reload nginx
```

---

## 3. How it Works

1. When you run `npm run build` or restart the Next.js process, Next.js stops listening on port `3000`.
2. Nginx fails to connect to port `3000` and generates a `502 Bad Gateway` error internally.
3. Nginx intercepts this error and redirects the request internally to `/maintenance.html`, serving `public/maintenance.html` instantly.
4. The page loads a beautiful animated loader informing the user that updates are being applied.
5. A background JavaScript polling script sends request pings back to Nginx every 4 seconds. 
6. Once the build completes and Next.js starts listening again, the ping gets a success status (status code `200`).
7. The script detects this and automatically triggers a page refresh (`window.location.reload()`), smoothly taking the user back to the school portal without them having to manually refresh!
