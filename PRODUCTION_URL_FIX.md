# Production URL Redirect Fix

## Problem
After logout, users were being redirected to `os.wazireducationsociety.org` instead of `dps.wazireducationsociety.org`.

## Root Cause
The `NEXTAUTH_URL` environment variable was set to the wrong domain.

## Fixes Applied

### 1. Updated Local .env File
```env
NEXTAUTH_URL="https://dps.wazireducationsociety.org"
```
**Note:** This change only affects local development.

### 2. Added Domain Redirect in next.config.ts
Added automatic redirect from `os.wazireducationsociety.org` to `dps.wazireducationsociety.org`:

```typescript
async redirects() {
  return [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'os.wazireducationsociety.org' }],
      destination: 'https://dps.wazireducationsociety.org/:path*',
      permanent: true,
    },
  ];
}
```

### 3. Enhanced Auth Redirect Callback
Updated `src/lib/auth.ts` with a redirect callback that properly handles production URLs.

### 4. Fixed Logout Button
Updated `src/components/layout/Sidebar.tsx` to use relative path `"/"` instead of hardcoded origins.

---

## 🚨 CRITICAL: Production Environment Variable Update Required

### You MUST update the environment variable on your hosting platform:

#### If using Vercel:
1. Go to your project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Find `NEXTAUTH_URL`
4. Update the value to: `https://dps.wazireducationsociety.org`
5. Click **Save**
6. **Redeploy** your application

#### If using Railway/Render/Other:
1. Go to your project settings
2. Find Environment Variables section
3. Update `NEXTAUTH_URL=https://dps.wazireducationsociety.org`
4. Save and redeploy

---

## Testing
After deployment:
1. Login to the application
2. Click logout
3. Verify you're redirected to `https://dps.wazireducationsociety.org/` (not os.wazir...)

---

## Summary of Changes
- ✅ `.env` - Updated NEXTAUTH_URL
- ✅ `next.config.ts` - Added domain redirect rule
- ✅ `src/lib/auth.ts` - Enhanced redirect callback
- ✅ `src/components/layout/Sidebar.tsx` - Fixed logout redirect
- ⚠️ **Production Environment Variables** - MUST BE UPDATED MANUALLY

---

**Date:** January 2026
**Status:** Code changes complete. Production env var update required.
