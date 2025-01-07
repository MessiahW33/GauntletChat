'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface SignOutProps {
  onSignOut: () => void
}

export default function SignOut({ onSignOut }: SignOutProps) {
  const handleSignOut = () => {
    localStorage.removeItem('discord_clone_username')
    onSignOut()
  }

  return (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      size="sm"
      className="text-gray-300 hover:text-white"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  )
}

