import { supabase } from './supabase'

export interface Channel {
  id: string
  name: string
  created_at: string
}

export interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface File {
  id: string
  message_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  username: string
  content: string
  created_at: string
  reactions: Reaction[]
  files: File[]
}

export async function getChannels(): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching channels:', error)
    throw error
  }

  return data || []
}

export async function addChannel(name: string): Promise<Channel> {
  console.log('Attempting to add channel:', name)
  const { data, error } = await supabase
    .from('channels')
    .insert({ name })
    .select()
    .single()

  if (error) {
    console.error('Supabase error adding channel:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to add channel: ${error.message || 'Unknown error'}`)
  }

  if (!data) {
    console.error('No data returned when adding channel')
    throw new Error('No data returned when adding channel')
  }

  console.log('Channel added successfully:', data)
  return data
}

export async function getMessages(channelId: string): Promise<Message[]> {
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*, reactions(*), files(*)')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    console.error('Error fetching messages:', messagesError)
    throw messagesError
  }

  return messages || []
}

export async function addMessage(channelId: string, username: string, content: string, file?: File): Promise<Message> {
  console.log('Attempting to add message:', { channelId, username, content, file: file ? file.name : 'No file' })
  
  let fileData: { file_url: string; file_name: string; file_type: string; file_size: number } | undefined

  if (file) {
    try {
      const fileUrl = await uploadFile(file)
      fileData = {
        file_url: fileUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size
      }
      console.log('File data prepared:', fileData)
    } catch (error) {
      console.error('Error uploading file:', error)
      // Instead of throwing, we'll proceed without the file
      console.warn('Proceeding to send message without file attachment')
    }
  }

  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({ channel_id: channelId, username, content })
    .select()
    .single()

  if (messageError) {
    console.error('Supabase error adding message:', messageError)
    throw new Error(`Failed to add message: ${messageError.message}`)
  }

  if (!message) {
    throw new Error('No data returned when adding message')
  }

  if (fileData) {
    const { error: fileError } = await supabase
      .from('files')
      .insert({
        message_id: message.id,
        ...fileData
      })

    if (fileError) {
      console.error('Supabase error adding file:', fileError)
      // If file metadata insertion fails, we'll still return the message without the file info
      console.warn('File uploaded but metadata not saved in database')
    }
  }

  console.log('Message added successfully:', message)
  return { ...message, reactions: [], files: fileData ? [fileData] : [] }
}

export async function addReaction(messageId: string, userId: string, emoji: string): Promise<Reaction | null> {
  try {
    const { data, error } = await supabase
      .from('reactions')
      .insert({ message_id: messageId, user_id: userId, emoji })
      .select()
      .single()

    if (error) {
      console.error('Error adding reaction:', error)
      if (error.code === '42P01') {
        console.error('Reactions table does not exist')
        return null
      }
      throw error
    }

    if (!data) {
      throw new Error('No data returned when adding reaction')
    }

    console.log('Reaction added successfully:', data)
    return data
  } catch (error) {
    console.error('Error in addReaction:', error)
    return null
  }
}

async function uploadFile(file: File): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload')
  }

  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileName = `${timestamp}-${randomString}.${fileExt}`

  try {
    const { data, error } = await supabase.storage
      .from('discord-clone-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase storage error:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned when uploading file')
    }

    const { data: { publicUrl }, error: urlError } = supabase.storage
      .from('discord-clone-files')
      .getPublicUrl(data.path)

    if (urlError) {
      console.error('Error getting public URL:', urlError)
      throw new Error(`Failed to get public URL: ${urlError.message}`)
    }

    console.log('File uploaded successfully:', publicUrl)
    return publicUrl
  } catch (error) {
    console.error('Error in uploadFile:', error)
    throw error
  }
}

