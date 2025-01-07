import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bnpldkuecsdrfymqxlio.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucGxka3VlY3NkcmZ5bXF4bGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxODU2MTIsImV4cCI6MjA1MTc2MTYxMn0.8ikCWRWIdwlXE9t-drr-pOuv5GHO82sj53bG9bcN3Rk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

export async function testStorageAccess() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      throw error
    }

    console.log('Available buckets:', buckets.map(b => b.name))

    const discordBucket = buckets.find(b => b.name === 'discord-clone-files')
    if (!discordBucket) {
      console.error('discord-clone-files bucket not found')
      return
    }

    const { data: files, error: filesError } = await supabase.storage
      .from('discord-clone-files')
      .list()

    if (filesError) {
      throw filesError
    }

    console.log('Files in discord-clone-files bucket:', files.map(f => f.name))
  } catch (error) {
    console.error('Storage access test failed:', error)
  }
}

// Call this function when your app initializes
testStorageAccess()

