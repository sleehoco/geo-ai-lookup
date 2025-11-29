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

        // Check for Vercel GeoIP headers first (fastest, no external API needed)
        const vercelCity = request.headers.get('x-vercel-ip-city');
        const vercelCountry = request.headers.get('x-vercel-ip-country');
        const vercelRegion = request.headers.get('x-vercel-ip-country-region');
        const vercelLat = request.headers.get('x-vercel-ip-latitude');
        const vercelLong = request.headers.get('x-vercel-ip-longitude');

        if (vercelCity && vercelCountry) {
            return NextResponse.json({
                ip: request.headers.get('x-forwarded-for') || 'unknown',
                city: decodeURIComponent(vercelCity),
                region: vercelRegion ? decodeURIComponent(vercelRegion) : '',
                country: vercelCountry,
                latitude: vercelLat || '0',
                longitude: vercelLong || '0',
            });
        }

        // Always try to detect user IP from headers
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');

        // If running on Vercel or behind a proxy, x-forwarded-for is usually the best bet
        // It can be a comma-separated list, the first one is the client
        userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp;

        // Handle localhost/private IPs
        if (userIp === '::1' || userIp === '127.0.0.1') {
            userIp = null;
        }

        let apiUrl = `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}`;

        // Append IP if found (so the API knows who the user is, even if we use GPS)
        if (userIp) {
            apiUrl += `&ip=${userIp}`;
        }

        // If coordinates provided, use them (highest priority)
        if (lat && long) {
            apiUrl += `&lat=${lat}&long=${long}`;
        }
        // If zip provided, use it
        else if (zip) {
            apiUrl += `&zip=${zip}&country=US`; // Defaulting to US for ZIP as per previous frontend logic
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('GeoIP Upstream Error:', errorText);

            if (response.status === 401 || response.status === 403) {
                return NextResponse.json(
                    { error: 'Invalid GeoIP API Key' },
                    { status: 500 }
                );
            }

            throw new Error(`Upstream API failed: ${response.status} ${errorText}`);
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
        const errorMessage = error instanceof Error ? error.message : 'Failed to determine location';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
