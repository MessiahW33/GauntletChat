import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    const testFile = new File(['Hello, World!'], 'test.txt', { type: 'text/plain' })
    const { data, error } = await supabase.storage
      .from('discord-clone-files')
      .upload(`test-${Date.now()}.txt`, testFile)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, path: data.path })
  } catch (error) {
    console.error('Server-side upload test failed:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

