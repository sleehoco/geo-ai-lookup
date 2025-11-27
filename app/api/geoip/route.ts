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

            // If running on Vercel or behind a proxy, x-forwarded-for is usually the best bet
            // It can be a comma-separated list, the first one is the client
            let userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp;

            // If we have a user IP, pass it to the API
            // If we don't pass an IP, ipgeolocation.io uses the caller's IP (the server's IP)
            // We want to avoid using the server's IP if possible, but if we can't find a user IP, 
            // we might as well let the API detect the caller (which would be the server).
            // However, for local dev (localhost), we might not have a valid public IP.
            if (userIp) {
                apiUrl += `&ip=${userIp}`;
            }
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch location data');
        }

        const data = await response.json();

        return NextResponse.json({
            ip: data.ip,
            city: data.city,
            region: data.state_prov,
            country: data.country_name,
            latitude: data.latitude,
            longitude: data.longitude,
        });
    } catch (error) {
        console.error('GeoIP Error:', error);
        return NextResponse.json(
            { error: 'Failed to determine location' },
            { status: 500 }
        );
    }
}
