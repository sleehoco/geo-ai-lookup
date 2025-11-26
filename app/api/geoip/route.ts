import { NextResponse } from 'next/server';

// Force dynamic rendering - don't try to pre-render this route at build time
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Using ipgeolocation.io for reliable geolocation
        const apiKey = process.env.IPGEOLOCATION_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'GeoIP API key not configured' },
                { status: 500 }
            );
        }

        const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}`);

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
