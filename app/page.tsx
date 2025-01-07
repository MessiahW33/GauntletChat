import DiscordClone from './components/DiscordClone'
import { getChannels } from './lib/db'

export default async function Home() {
  try {
    const channels = await getChannels()
    return <DiscordClone initialChannels={channels} />
  } catch (error) {
    console.error('Error fetching initial channels:', error)
    return <DiscordClone initialChannels={[]} />
  }
}

