import { supabase } from '@/api/supabase';


 // Initialize the default categories in the database
 
export async function initializeCategories() {
  console.log('Checking and initializing categories...');
  
  // Check if categories exist
  const { data: existingCategories, error: checkError } = await supabase
    .from('Categories')
    .select('*');
    
  if (checkError) {
    console.error('Error checking categories:', checkError);
    return;
  }
  
  if (!existingCategories || existingCategories.length === 0) {
    console.log('No categories found. Creating default categories...');
    
    // Insert the default categories
    const { error: insertError } = await supabase
      .from('Categories')
      .insert([
        { category_name: 'General Knowledge', description: 'General trivia questions on various topics' },
        { category_name: 'Science', description: 'Questions related to physics, chemistry, biology, and other sciences' },
        { category_name: 'History', description: 'Questions about historical events, figures, and periods' },
        { category_name: 'Literature', description: 'Questions about books, authors, and literary works' },
        { category_name: 'Mathematics', description: 'Questions related to mathematical concepts and problems' },
        { category_name: 'Technology', description: 'Questions about computers, software, and modern technology' },
        { category_name: 'Arts', description: 'Questions about visual arts, music, and performing arts' }
      ]);
      
    if (insertError) {
      console.error('Error creating default categories:', insertError);
    } else {
      console.log('Default categories created successfully');
    }
  } else {
    console.log('Categories already exist:', existingCategories.map(c => c.category_name).join(', '));
  }
}