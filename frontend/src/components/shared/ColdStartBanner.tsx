'use client'

import { useState, useEffect } from 'react'
import { Loader2, Server, X } from 'lucide-react'

export default function ColdStartBanner() {
  const [show, setShow] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    let interval: NodeJS.Timeout
    let pollInterval: NodeJS.Timeout
    let isSubscribed = true

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    const healthUrl = baseUrl.replace(/\/api\/?$/, '/health/')

    const checkHealth = async (): Promise<boolean> => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000)

        const res = await fetch(healthUrl, {
          cache: 'no-store',
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (res.ok && isSubscribed) {
          setShow(false) // Server is active/healthy — hide banner immediately!
          return true
        }
      } catch {
        // Server not ready or timed out
      }
      return false
    }

    // Initial check: if server is already active, don't schedule banner at all
    checkHealth().then((isAlive) => {
      if (!isAlive && isSubscribed && !dismissed) {
        // Schedule banner after 3 seconds if server isn't active
        timer = setTimeout(() => {
          if (isSubscribed && !dismissed) {
            setShow(true)

            // Poll health every 3 seconds while waking up to auto-hide as soon as ready
            pollInterval = setInterval(async () => {
              const alive = await checkHealth()
              if (alive && pollInterval) {
                clearInterval(pollInterval)
              }
            }, 3000)
          }
        }, 3000)
      }
    })

    // Seconds counter + 60s auto-off
    interval = setInterval(() => {
      setSeconds((s) => {
        if (s >= 59) {
          setShow(false) // Auto off after 60 seconds
          clearInterval(interval)
          if (pollInterval) clearInterval(pollInterval)
          return 60
        }
        return s + 1
      })
    }, 1000)

    return () => {
      isSubscribed = false
      if (timer) clearTimeout(timer)
      if (interval) clearInterval(interval)
      if (pollInterval) clearInterval(pollInterval)
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
          Free tier cold start - {seconds}s
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
