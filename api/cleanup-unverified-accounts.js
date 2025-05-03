import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Set cutoff time (24 hours ago)
const VERIFICATION_WINDOW_HOURS = 24;

export default async function handler(req, res) {
  // Only allow POST requests with proper authorization
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check for secret token to ensure only authorized requests can run this endpoint
  const { authorization } = req.headers;
  const expectedToken = process.env.CLEANUP_SECRET_TOKEN;
  
  if (!authorization || authorization !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Calculate cutoff time (24 hours ago)
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - VERIFICATION_WINDOW_HOURS);
    
    // Find unverified accounts older than the cutoff date
    const { data, error } = await supabase
      .from('Users')
      .select('id, username, email, created_at')
      .eq('confirmed', false)
      .lt('created_at', cutoffDate.toISOString());
    
    if (error) {
      console.error('Error finding unverified accounts:', error);
      return res.status(500).json({ 
        error: 'Failed to query unverified accounts',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
    
    if (!data || data.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No unverified accounts to clean up',
        deleted: 0
      });
    }
    
    // Extract IDs of accounts to delete
    const accountIds = data.map(account => account.id);
    
    // Delete the accounts
    const { error: deleteError } = await supabase
      .from('Users')
      .delete()
      .in('id', accountIds);
    
    if (deleteError) {
      console.error('Error deleting unverified accounts:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete unverified accounts',
        details: process.env.NODE_ENV === 'development' ? deleteError : undefined
      });
    }
    
    return res.status(200).json({ 
      success: true,
      message: `Successfully cleaned up ${data.length} unverified accounts`,
      deleted: data.length,
      accounts: process.env.NODE_ENV === 'development' ? data.map(a => ({ id: a.id, email: a.email })) : undefined
    });
  } catch (error) {
    console.error('Error in account cleanup process:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to clean up unverified accounts',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}