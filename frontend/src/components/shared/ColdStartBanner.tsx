'use client'

import { useState, useEffect } from 'react'
import { Loader2, Server, X } from 'lucide-react'
import api from '@/lib/axios'

export default function ColdStartBanner() {
  const [show, setShow] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    let interval: NodeJS.Timeout
    let isSubscribed = true

    // Check if backend server is already active
    const checkServerHealth = async () => {
      try {
        // Fast ping to see if server is active (using root health endpoint)
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
        const healthUrl = baseUrl.replace(/\/api\/?$/, '/health/')
        
        const response = await fetch(healthUrl, { signal: AbortSignal.timeout(2500) })
        if (response.ok && isSubscribed) {
          setShow(false) // Server is active, do not show banner
          return
        }
      } catch {
        // Health check failed or timed out — server is cold/waking up
      }

      if (isSubscribed && !dismissed) {
        timer = setTimeout(() => setShow(true), 3000)
      }
    }

    checkServerHealth()

    interval = setInterval(() => {
      setSeconds((s) => {
        if (s >= 59) {
          setShow(false) // Auto off after 60 seconds
          clearInterval(interval)
          return 60
        }
        return s + 1
      })
    }, 1000)

    return () => {
      isSubscribed = false
      if (timer) clearTimeout(timer)
      if (interval) clearInterval(interval)
    }
  }, [dismissed])

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 max-w-sm border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="p-2 bg-blue-500 rounded-lg shrink-0">
        <Server className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">Server waking up...</p>
        <p className="text-xs text-slate-400">
          Free tier cold start — {seconds}s
        </p>
      </div>
      <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors ml-1"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
