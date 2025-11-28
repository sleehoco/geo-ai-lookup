# Add NEXT_PUBLIC_IPGEOLOCATION_API_KEY to Vercel

You need to add **one more** environment variable to Vercel for the ZIP code and GPS features to work.

## Steps:

1. Go to Vercel Environment Variables page (should still be open)
2. Add a **second** environment variable:
   - **Key**: `NEXT_PUBLIC_IPGEOLOCATION_API_KEY`
   - **Value**: Your ipgeolocation.io API key (same as before)
   - **Environments**: Check all three (Production, Preview, Development)
3. Click **"Save"**

## Why Two Variables?

- `IPGEOLOCATION_API_KEY` - Used by the server (for IP-based detection)
- `NEXT_PUBLIC_IPGEOLOCATION_API_KEY` - Used by the browser (for ZIP & GPS features)

The `NEXT_PUBLIC_` prefix makes it available to the client-side code.

## After Saving:

Vercel will redeploy automatically. Once done, you'll have:
- 🌐 Auto IP detection
- 📮 Manual ZIP code entry
- 📍 GPS location (works great on phones!)
