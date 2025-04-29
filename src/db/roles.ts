import { supabase } from '@/api/supabase';

/**
 * Initialize the default roles in the database
 */
export async function initializeRoles() {
  console.log('Checking and initializing roles...');
  
  // Check if roles exist
  const { data: existingRoles, error: checkError } = await supabase
    .from('Roles')
    .select('*');
    
  if (checkError) {
    console.error('Error checking roles:', checkError);
    return;
  }
  
  if (!existingRoles || existingRoles.length === 0) {
    console.log('No roles found. Creating default roles...');
    
    // Insert the default roles
    const { error: insertError } = await supabase
      .from('Roles')
      .insert([
        { role_name: 'admin' },
        { role_name: 'teacher' },
        { role_name: 'user' }
      ]);
      
    if (insertError) {
      console.error('Error creating default roles:', insertError);
    } else {
      console.log('Default roles created successfully');
    }
  } else {
    console.log('Roles already exist:', existingRoles.map(r => r.role_name).join(', '));
  }
}