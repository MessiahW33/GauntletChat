'use client'

import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Sidebar from './Sidebar'
import ChatArea from './ChatArea'
import Header from './Header'
import SignIn from './SignIn'
import { Channel, getChannels } from '../lib/db'
import { testStorageAccess } from '../lib/test-storage'
import { testFileUpload } from '../lib/test-upload'

interface DiscordCloneProps {
  initialChannels: Channel[]
}

export default function DiscordClone({ initialChannels }: DiscordCloneProps) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(initialChannels.length === 0)

  useEffect(() => {
    const storedUsername = localStorage.getItem('discord_clone_username')
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  useEffect(() => {
    if (channels.length > 0 && !currentChannel) {
      setCurrentChannel(channels[0])
    }
  }, [channels, currentChannel])

  useEffect(() => {
    const fetchChannels = async () => {
      setIsLoading(true)
      try {
        const fetchedChannels = await getChannels()
        setChannels(fetchedChannels)
        if (fetchedChannels.length > 0) {
          setCurrentChannel(fetchedChannels[0])
        }
      } catch (error) {
        console.error('Error fetching channels:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (initialChannels.length === 0) {
      fetchChannels()
    } else {
      setIsLoading(false)
    }
  }, [initialChannels])

  useEffect(() => {
    testStorageAccess()
    testFileUpload()
  }, [])

  const handleSignIn = (newUsername: string) => {
    setUsername(newUsername)
  }

  const handleSignOut = () => {
    setUsername(null)
    setCurrentChannel(null)
    localStorage.removeItem('discord_clone_username')
  }

  const handleChannelAdded = (newChannel: Channel) => {
    setChannels(prevChannels => [...prevChannels, newChannel])
    if (channels.length === 0) {
      setCurrentChannel(newChannel)
    }
  }

  if (!username) {
    return <SignIn onSignIn={handleSignIn} />
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-800 text-white">Loading channels...</div>
  }

  return (
    <div className="flex h-screen bg-gray-800 text-white">
      <Toaster />
      <Sidebar 
        channels={channels} 
        currentChannel={currentChannel} 
        onSelectChannel={setCurrentChannel}
        onChannelAdded={handleChannelAdded}
      />
      <div className="flex flex-col flex-1">
        <Header 
          channelName={currentChannel?.name || 'No channel selected'} 
          username={username}
          onSignOut={handleSignOut}
        />
        {currentChannel ? (
          <ChatArea 
            channelId={currentChannel.id}
            username={username}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            {channels.length === 0 ? 'Create a channel to get started' : 'Please select a channel'}
          </div>
        )}
      </div>
    </div>
  )
}

