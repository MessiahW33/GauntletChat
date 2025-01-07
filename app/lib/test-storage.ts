import { supabase } from './supabase'

export async function testStorageAccess() {
  console.log('Testing Supabase storage access...')

  try {
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`)
    }

    console.log('Available buckets:', buckets.map(bucket => bucket.name))

    // Check for discord-clone-files bucket
    const discordBucket = buckets.find(bucket => bucket.name === 'discord-clone-files')

    if (!discordBucket) {
      throw new Error('discord-clone-files bucket not found')
    }

    console.log('discord-clone-files bucket found')

    // Try to list files in the bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('discord-clone-files')
      .list()

    if (filesError) {
      throw new Error(`Failed to list files: ${filesError.message}`)
    }

    console.log('Files in discord-clone-files bucket:', files.map(file => file.name))

    console.log('Storage access test completed successfully')
  } catch (error) {
    console.error('Storage access test failed:', error)
  }
}

