import { NextResponse } from 'next/server';

// Force dynamic rendering - don't try to pre-render this route at build time
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Using ipgeolocation.io for reliable geolocation
        const apiKey = process.env.IPGEOLOCATION_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'GeoIP API key not configured' },
                { status: 500 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('lat');
        const long = searchParams.get('long');
        const zip = searchParams.get('zip');

        // Initialize userIp variable
        let userIp: string | null = null;

        let apiUrl = `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}`;

        // If coordinates provided, use them (highest priority)
        if (lat && long) {
            apiUrl += `&lat=${lat}&long=${long}`;
        }
        // If zip provided, use it
        else if (zip) {
            apiUrl += `&zip=${zip}&country=US`; // Defaulting to US for ZIP as per previous frontend logic
        }
        // Otherwise use IP (try to get user's IP)
        else {
            // Get user IP from headers
            const forwardedFor = request.headers.get('x-forwarded-for');
            const realIp = request.headers.get('x-real-ip');

            console.log('GeoIP Debug - Headers:', {
                forwardedFor,
                realIp,
                allHeaders: Object.fromEntries(request.headers.entries())
            });

            // If running on Vercel or behind a proxy, x-forwarded-for is usually the best bet
            // It can be a comma-separated list, the first one is the client
            userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp;

            // Handle localhost/private IPs
            if (userIp === '::1' || userIp === '127.0.0.1') {
                userIp = null;
            }

            console.log('GeoIP Debug - Detected User IP:', userIp);

            // If we have a user IP, pass it to the API
            if (userIp) {
                apiUrl += `&ip=${userIp}`;
            }
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('GeoIP Upstream Error:', errorText);
            throw new Error(`Upstream API failed: ${response.status} ${errorText}`);
        }

        const data = await response.json();

        console.log('GeoIP Debug - Upstream Response:', {
            params: { lat, long, zip, userIp },
            data
        });

        return NextResponse.json({
            ip: data.ip,
            city: data.city,
            region: data.state_prov,
            country: data.country_name,
            latitude: data.latitude,
            longitude: data.longitude,
        });
    } catch (error: any) {
        console.error('GeoIP Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to determine location' },
            { status: 500 }
        );
    }
}
