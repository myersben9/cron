import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addGuestBackground } from '@/lib/background';

const schema = z.object({
    googleToken: z.string(),    
    googleEventId: z.string(),
    guestEmail: z.string(), 
    description: z.string(),
    dateTime: z.string(),
    serviceToken: z.string(),
});


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { googleToken, googleEventId, guestEmail, description, dateTime, serviceToken }= schema.parse(body)
        // Validate the service token
        if (serviceToken !== process.env.SERVICE_TOKEN) {
            return NextResponse.json({error: 'Invalid service token'}, {status: 401});
        }
        await addGuestBackground({ googleToken, googleEventId, guestEmail, description, dateTime });
        return NextResponse.json({message: 'Guest added successfully'});
    } catch (error) {
        console.log(error);
        return NextResponse.json({error: 'Invalid request'}, {status: 400});
    }
}