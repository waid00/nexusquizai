import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Check both VITE_ prefixed and non-prefixed env vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;

console.log('Supabase config in verify-email API:', { 
  urlExists: !!supabaseUrl, 
  keyExists: !!supabaseKey,
  url: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'undefined'
});

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Verification token expiry time in hours
const TOKEN_EXPIRY_HOURS = 24;

export default async function handler(req, res) {
  console.log('Verify email API called, method:', req.method);

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests for API security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Verify email request body:', req.body);
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    console.log('Verifying token:', token);
    
    // Decode the token to get user ID and timestamp
    let decodedToken;
    try {
      decodedToken = Buffer.from(token, 'base64').toString('utf-8');
      const [userId, timestamp, _] = decodedToken.split(':');
      
      // Validate token format
      if (!userId || !timestamp) {
        return res.status(400).json({ error: 'Invalid token format' });
      }
      
      // Check token expiry (24 hours)
      const tokenTime = parseInt(timestamp);
      const currentTime = new Date().getTime();
      const expiryTime = tokenTime + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
      
      if (currentTime > expiryTime) {
        return res.status(400).json({ error: 'Verification token has expired' });
      }
      
      // Update user as confirmed
      const { error: updateError } = await supabase
        .from('Users')
        .update({ 
          confirmed: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);      if (updateError) {
        console.error('Error updating user:', updateError);
        return res.status(500).json({ error: 'Failed to verify email' });
      }

      console.log('Email verified successfully for user ID:', userId);
      return res.status(200).json({ 
        success: true,
        message: 'Email verified successfully' 
      });
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError);
      return res.status(400).json({ error: 'Invalid verification token' });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to verify email',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}