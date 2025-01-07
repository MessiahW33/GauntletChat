import { Hash, User } from 'lucide-react'
import SignOut from './SignOut'

interface HeaderProps {
  channelName: string
  username: string
  onSignOut: () => void
}

export default function Header({ channelName, username, onSignOut }: HeaderProps) {
  return (
    <header className="bg-gray-700 p-4 flex items-center justify-between">
      <div className="flex items-center">
        <Hash className="mr-2" size={24} />
        <h2 className="text-xl font-semibold">{channelName}</h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <User className="mr-2" size={18} />
          <span className="text-sm font-medium">{username}</span>
        </div>
        <SignOut onSignOut={onSignOut} />
      </div>
    </header>
  )
}

