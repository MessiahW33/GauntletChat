'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('No file selected')
      return
    }

    setUploadStatus('Uploading...')

    try {
      const { data, error } = await supabase.storage
        .from('discord-clone-files')
        .upload(`test-${Date.now()}.${file.name.split('.').pop()}`, file)

      if (error) {
        throw error
      }

      setUploadStatus(`File uploaded successfully. Path: ${data.path}`)
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadStatus(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="p-4">
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
        Upload
      </button>
      <p className="mt-2">{uploadStatus}</p>
    </div>
  )
}

