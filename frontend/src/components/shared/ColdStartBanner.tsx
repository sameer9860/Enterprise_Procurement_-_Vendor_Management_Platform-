'use client'

import { useState, useEffect } from 'react'
import { Loader2, Server } from 'lucide-react'

export default function ColdStartBanner() {
  const [show, setShow] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    // Show banner if API takes more than 3 seconds
    const timer = setTimeout(() => setShow(true), 3000)
    const interval = setInterval(
      () => setSeconds((s) => s + 1),
      1000
    )

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 max-w-sm">
      <div className="p-2 bg-blue-500 rounded-lg">
        <Server className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-medium">Server waking up...</p>
        <p className="text-xs text-slate-400">
          Free tier cold start — {seconds}s
        </p>
      </div>
      <Loader2 className="w-4 h-4 animate-spin text-blue-400 ml-2" />
    </div>
  )
}
