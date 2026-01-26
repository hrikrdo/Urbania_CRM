"use client"

import { useState, useEffect, useCallback } from "react"

const ATTENTION_TIMEOUT_MINUTES = 60

export type TimerStatus = "active" | "warning" | "critical" | "expired"

export interface TimerState {
  remainingMs: number
  remainingMinutes: number
  remainingSeconds: number
  status: TimerStatus
  isExpired: boolean
  formattedTime: string
}

function getTimerStatus(remainingMs: number): TimerStatus {
  if (remainingMs <= 0) return "expired"
  const minutes = remainingMs / 1000 / 60
  if (minutes <= 5) return "critical"
  if (minutes <= 15) return "warning"
  return "active"
}

function formatTime(remainingMs: number): string {
  if (remainingMs <= 0) return "Expirado"

  const totalSeconds = Math.floor(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    return `${hours}h ${remainingMins}m`
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function useLeadTimer(attentionDeadline: string | null): TimerState {
  const calculateRemaining = useCallback(() => {
    if (!attentionDeadline) return 0
    const deadline = new Date(attentionDeadline).getTime()
    return Math.max(0, deadline - Date.now())
  }, [attentionDeadline])

  const [remainingMs, setRemainingMs] = useState(calculateRemaining)

  useEffect(() => {
    if (!attentionDeadline) return

    // Update immediately
    setRemainingMs(calculateRemaining())

    // Update every second
    const interval = setInterval(() => {
      const newRemaining = calculateRemaining()
      setRemainingMs(newRemaining)

      // Stop interval if expired
      if (newRemaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [attentionDeadline, calculateRemaining])

  const status = getTimerStatus(remainingMs)
  const totalSeconds = Math.floor(remainingMs / 1000)

  return {
    remainingMs,
    remainingMinutes: Math.floor(totalSeconds / 60),
    remainingSeconds: totalSeconds % 60,
    status,
    isExpired: remainingMs <= 0,
    formattedTime: formatTime(remainingMs),
  }
}

// Utility function to calculate attention deadline when creating a lead
export function calculateAttentionDeadline(minutes: number = ATTENTION_TIMEOUT_MINUTES): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

// Check if a lead should be moved to pool (called from backend/cron)
export function shouldMoveToPool(attentionDeadline: string | null, attentionExpired: boolean): boolean {
  if (attentionExpired) return true
  if (!attentionDeadline) return false
  return new Date(attentionDeadline).getTime() < Date.now()
}
