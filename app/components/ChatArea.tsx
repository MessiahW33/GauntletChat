'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Smile, Paperclip } from 'lucide-react'
import { Message, getMessages, addMessage, addReaction } from '../lib/db'
import { supabase } from '../lib/supabase'
import EmojiPicker from 'emoji-picker-react'
import { toast } from 'react-hot-toast'

interface ChatAreaProps {
  channelId: string
  username: string
}

export default function ChatArea({ channelId, username }: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)

  const fetchMessages = useCallback(async () => {
    setIsLoading(true)
    try {
      const fetchedMessages = await getMessages(channelId)
      console.log('Fetched messages:', fetchedMessages)
      setMessages(fetchedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to fetch messages. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel(`public:messages:channel_id=eq.${channelId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `channel_id=eq.${channelId}` 
        }, 
        (payload) => {
          console.log('New message received:', payload.new)
          setMessages(prevMessages => [...prevMessages, { ...payload.new as Message, reactions: [], files: [] }])
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    const reactionsChannel = supabase
      .channel('public:reactions')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions'
        },
        (payload) => {
          console.log('New reaction received:', payload.new)
          setMessages(prevMessages => 
            prevMessages.map(message => 
              message.id === payload.new.message_id
                ? { ...message, reactions: [...(message.reactions || []), payload.new] }
                : message
            )
          )
        }
      )
      .subscribe((status) => {
        console.log('Reactions subscription status:', status)
      })

    return () => {
      channel.unsubscribe()
      reactionsChannel.unsubscribe()
    }
  }, [channelId, fetchMessages])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((newMessage.trim() || selectedFile) && !isSending) {
      setIsSending(true)
      try {
        console.log('Sending message with file:', selectedFile ? selectedFile.name : 'No file')
        const sentMessage = await addMessage(channelId, username, newMessage.trim(), selectedFile || undefined)
        console.log('Message sent successfully:', sentMessage)
        setMessages(prevMessages => [...prevMessages, sentMessage])
        setNewMessage('')
        setSelectedFile(null)
        toast.success('Message sent successfully')
      } catch (error) {
        console.error('Error sending message:', error)
        if (error instanceof Error) {
          if (error.message.includes('Failed to upload file')) {
            toast.error(`Failed to upload file: ${error.message}`)
          } else if (error.message.includes('Storage bucket does not exist')) {
            toast.error('Storage is not properly configured. Please contact support.')
          } else {
            toast.error(`Failed to send message: ${error.message}`)
          }
        } else {
          toast.error('An unknown error occurred while sending the message')
        }
      } finally {
        setIsSending(false)
      }
    }
  }

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const reaction = await addReaction(messageId, username, emoji)
      if (reaction) {
        setMessages(prevMessages =>
          prevMessages.map(message =>
            message.id === messageId
              ? { ...message, reactions: [...(message.reactions || []), reaction] }
              : message
          )
        )
      } else {
        console.log('Reactions are not available')
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
      toast.error('Failed to add reaction. Please try again.')
    }
    setShowEmojiPicker(false)
    setSelectedMessageId(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size exceeds 5MB limit')
        return
      }
      setSelectedFile(file)
      toast.success(`File "${file.name}" selected`)
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800 text-white">
        Loading messages...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 max-h-[calc(100vh-200px)]"
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 p-4">No messages yet</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="mb-3">
              <div className="flex items-baseline">
                <span className="font-bold mr-2">{message.username}</span>
                <span className="text-xs text-gray-400">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1">{message.content}</p>
              {message.files && message.files.map((file, index) => (
                <div key={index} className="mt-2">
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    {file.file_name}
                  </a>
                </div>
              ))}
              <div className="flex items-center mt-1">
                {message.reactions && message.reactions.map((reaction, index) => (
                  <span key={index} className="mr-2 bg-gray-700 rounded-full px-2 py-1 text-xs">
                    {reaction.emoji}
                  </span>
                ))}
                <button
                  onClick={() => {
                    setSelectedMessageId(message.id)
                    setShowEmojiPicker(true)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <Smile size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {showEmojiPicker && selectedMessageId && (
        <div className="absolute bottom-16 right-4 z-10">
          <EmojiPicker
            onEmojiClick={(emojiObject) => handleAddReaction(selectedMessageId, emojiObject.emoji)}
          />
        </div>
      )}
      <form onSubmit={handleSendMessage} className="p-4 bg-gray-700 mt-auto">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-600 text-white rounded-l-md p-2 outline-none"
            disabled={isSending}
          />
          <label className="cursor-pointer bg-gray-600 text-white p-2">
            <Paperclip size={20} />
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSending}
            />
          </label>
          <button
            type="submit"
            className={`bg-blue-500 text-white rounded-r-md p-2 hover:bg-blue-600 ${
              isSending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSending}
          >
            <Send size={20} />
          </button>
        </div>
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-300">
            Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </div>
        )}
      </form>
    </div>
  )
}

