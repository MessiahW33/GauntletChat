import { supabase } from './supabase'

export async function testFileUpload() {
  console.log('Testing file upload...')

  const testFile = new File(['Hello, World!'], 'test.txt', { type: 'text/plain' })

  try {
    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const uniqueFileName = `test-${timestamp}-${randomString}.txt`

    const { data, error } = await supabase.storage
      .from('discord-clone-files')
      .upload(uniqueFileName, testFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    console.log('Test file uploaded successfully:', data)

    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('discord-clone-files')
      .getPublicUrl(uniqueFileName)

    if (urlError) {
      throw urlError
    }

    console.log('Public URL for test file:', publicUrl)
  } catch (error) {
    console.error('Error in test file upload:', error)
  }
}

