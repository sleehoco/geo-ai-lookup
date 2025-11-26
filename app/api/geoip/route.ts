import { NextResponse } from 'next/server';

// Force dynamic rendering - don't try to pre-render this route at build time
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // In a real production app, we would check 'x-forwarded-for' headers
        // to get the real client IP. For this demo/local, we'll just hit the API
        // which will see our request IP.

        // Using ipapi.co for demo purposes (free tier, rate limited)
        const response = await fetch('https://ipapi.co/json/');

        if (!response.ok) {
            throw new Error('Failed to fetch location data');
        }

        const data = await response.json();

        return NextResponse.json({
            ip: data.ip,
            city: data.city,
            region: data.region,
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
