
import { google } from 'googleapis';
import { decrypt } from './encrypt';
import { sendEmail } from './mail';
import { oauth2Client } from './oauth_client';

export async function addGuestBackground({
    googleToken,
    googleEventId,
    guestEmail,
    description,
    dateTime,
}: {
    googleToken: string ;
    googleEventId: string | null;
    guestEmail: string;
    description: string;
    dateTime: string;
}) : Promise<void> {

    try {
        // Decrypt the user's google tokens
        const decryptedGoogleTokens = await decrypt(googleToken);

        oauth2Client.setCredentials({
            access_token: decryptedGoogleTokens.accessToken,
            refresh_token: decryptedGoogleTokens.refreshToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        if (!googleEventId) {
            throw new Error('Event ID not found');
        }

        // Add the guest email to the event
        const existingEvent = await calendar.events.get({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            eventId: googleEventId,
        });

        // Get the start and end times from the existing event
        const { start, end } = existingEvent.data;

        if (!start || !end) {
            throw new Error('Failed to get event start and end times');
        }

        // Extract and add timezone to start and end times
        const updatedStart = {
            dateTime: start.dateTime, // Use the existing event's start time
        };

        const updatedEnd = {
            dateTime: end.dateTime, // Use the existing event's end time
        };
            
        const attendees = existingEvent.data.attendees || [];
        attendees.push({ email: guestEmail });

        // Update the event with the new attendee
        await calendar.events.patch({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            eventId : googleEventId,
            requestBody: {
                attendees,
                status: 'confirmed', // Optionally mark as confirmed
                start: updatedStart, // Include start with timezone
                end: updatedEnd, // Include end with timezone
                description: description
            },
            sendUpdates: 'all'
        });

        // Send a confirmation email to the guest
        await sendEmail({
            to: guestEmail,
            type: 'bookingConfirmation',
            timeslot: dateTime,
            outlook: true,
        });
    } catch (error) {
        throw new Error('Failed to add guest to event');
    }

}