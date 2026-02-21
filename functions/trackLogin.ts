import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const clientIp = body.ipAddress || req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const deviceInfo = body.deviceInfo || req.headers.get('user-agent') || 'unknown';

    // Get geolocation data from IP (using ip-api.com free tier)
    let locationData = {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      timezone: 'Unknown'
    };

    try {
      const ipResponse = await fetch(`https://ip-api.com/json/${clientIp.split(',')[0].trim()}?fields=country,city,region,timezone,status`);
      if (ipResponse.ok) {
        const geoData = await ipResponse.json();
        if (geoData.status === 'success') {
          locationData = {
            country: geoData.country || 'Unknown',
            city: geoData.city || 'Unknown',
            region: geoData.region || 'Unknown',
            timezone: geoData.timezone || 'Unknown'
          };
        }
      }
    } catch (error) {
      console.error('Failed to get geolocation:', error);
      // Continue without location data
    }

    // Create login history record
    const loginRecord = await base44.asServiceRole.entities.LoginHistory.create({
      userId: user.id,
      email: user.email,
      ipAddress: clientIp.split(',')[0].trim(),
      country: locationData.country,
      city: locationData.city,
      region: locationData.region,
      timezone: locationData.timezone,
      deviceInfo,
      loginTime: new Date().toISOString()
    });

    return Response.json({
      success: true,
      loginRecord
    });
  } catch (error) {
    console.error('Login tracking error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});