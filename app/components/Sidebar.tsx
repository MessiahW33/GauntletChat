'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import { Channel, addChannel } from '../lib/db'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

interface SidebarProps {
  channels: Channel[]
  currentChannel: Channel | null
  onSelectChannel: (channel: Channel) => void
  onChannelAdded: (channel: Channel) => void
}

export default function Sidebar({ channels, currentChannel, onSelectChannel, onChannelAdded }: SidebarProps) {
  const [newChannelName, setNewChannelName] = useState('')
  const [isAddingChannel, setIsAddingChannel] = useState(false)

  useEffect(() => {
    const channelSubscription = supabase
      .channel('public:channels')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channels' }, payload => {
        const newChannel = payload.new as Channel
        if (!channels.some(channel => channel.id === newChannel.id)) {
          onChannelAdded(newChannel)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channelSubscription)
    }
  }, [channels, onChannelAdded])

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newChannelName.trim() && !isAddingChannel) {
      setIsAddingChannel(true)
      try {
        console.log('Attempting to add channel:', newChannelName.trim());
        const newChannel = await addChannel(newChannelName.trim())
        console.log('Channel added:', newChannel);
        setNewChannelName('')
        onChannelAdded(newChannel)
        onSelectChannel(newChannel)
        toast.success('Channel created successfully')
      } catch (error) {
        console.error('Error in handleAddChannel:', error)
        if (error instanceof Error) {
          toast.error(`Failed to create channel: ${error.message}`)
        } else {
          toast.error('Failed to create channel. Please try again.')
        }
      } finally {
        setIsAddingChannel(false)
      }
    }
  }

  return (
    <div className="w-64 bg-gray-900 p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Channels</h2>
      <ul className="flex-1 overflow-y-auto">
        {channels.map((channel) => (
          <li 
            key={channel.id} 
            className={`flex items-center mb-2 cursor-pointer p-2 rounded ${
              channel.id === currentChannel?.id ? 'bg-gray-700' : 'hover:bg-gray-800'
            }`}
            onClick={() => onSelectChannel(channel)}
          >
            <MessageSquare className="mr-2" size={18} />
            # {channel.name}
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddChannel} className="mt-4">
        <div className="flex items-center">
          <input
            type="text"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="New channel name"
            className="flex-1 bg-gray-700 text-white rounded-l-md p-2 outline-none"
            disabled={isAddingChannel}
          />
          <button
            type="submit"
            className={`bg-green-500 text-white rounded-r-md p-2 hover:bg-green-600 ${
              isAddingChannel ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isAddingChannel}
          >
            <Plus size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}

