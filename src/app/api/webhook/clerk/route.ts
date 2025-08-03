import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  console.log('Webhook body:', body);

  try {
    await dbConnect();

    switch (eventType) {
      case 'user.created':
        const { id: clerkId, email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses[0]?.email_address;
        
        if (email) {
          const user = new User({
            clerkId,
            name: `${first_name || ''} ${last_name || ''}`.trim() || email,
            email,
            firstName: first_name || '',
            lastName: last_name || '',
            imageUrl: image_url,
            role: 'user'
          });
          await user.save();
          console.log('User created in database:', user);
        }
        break;

      case 'user.updated':
        const { id: updatedClerkId, email_addresses: updatedEmails, first_name: updatedFirstName, last_name: updatedLastName, image_url: updatedImageUrl } = evt.data;
        const updatedEmail = updatedEmails[0]?.email_address;
        
        if (updatedEmail) {
          const updatedUser = await User.findOneAndUpdate(
            { clerkId: updatedClerkId },
            {
              name: `${updatedFirstName || ''} ${updatedLastName || ''}`.trim() || updatedEmail,
              email: updatedEmail,
              firstName: updatedFirstName || '',
              lastName: updatedLastName || '',
              imageUrl: updatedImageUrl
            },
            { new: true }
          );
          console.log('User updated in database:', updatedUser);
        }
        break;

      case 'user.deleted':
        const { id: deletedClerkId } = evt.data;
        const deletedUser = await User.findOneAndUpdate(
          { clerkId: deletedClerkId },
          { isActive: false },
          { new: true }
        );
        console.log('User deactivated in database:', deletedUser);
        break;

      default:
        console.log('Unhandled webhook event type:', eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 