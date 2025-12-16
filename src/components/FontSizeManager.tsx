'use client'

import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'emr-font-size'
const DEFAULT_FONT_SIZE = 13
const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 18
const STEP = 1

export function FontSizeManager() {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [mounted, setMounted] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)

  // Load saved font size on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const size = parseInt(saved, 10)
      if (size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) {
        setFontSize(size)
      }
    }
    setMounted(true)
  }, [])

  // Apply font size to document
  useEffect(() => {
    if (mounted) {
      document.documentElement.style.fontSize = `${fontSize}px`
      localStorage.setItem(STORAGE_KEY, fontSize.toString())
    }
  }, [fontSize, mounted])

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      const newSize = Math.min(prev + STEP, MAX_FONT_SIZE)
      if (newSize !== prev) {
        setShowIndicator(true)
        setTimeout(() => setShowIndicator(false), 1500)
      }
      return newSize
    })
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      const newSize = Math.max(prev - STEP, MIN_FONT_SIZE)
      if (newSize !== prev) {
        setShowIndicator(true)
        setTimeout(() => setShowIndicator(false), 1500)
      }
      return newSize
    })
  }, [])

  const resetFontSize = useCallback(() => {
    setFontSize(DEFAULT_FONT_SIZE)
    setShowIndicator(true)
    setTimeout(() => setShowIndicator(false), 1500)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = e.metaKey || e.ctrlKey

      if (!isMod) return

      // Cmd/Ctrl + Plus or Cmd/Ctrl + =
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        increaseFontSize()
      }
      // Cmd/Ctrl + Minus
      else if (e.key === '-') {
        e.preventDefault()
        decreaseFontSize()
      }
      // Cmd/Ctrl + 0 to reset
      else if (e.key === '0') {
        e.preventDefault()
        resetFontSize()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [increaseFontSize, decreaseFontSize, resetFontSize])

  if (!mounted) return null

  return (
    <>
      {/* Font size indicator popup */}
      {showIndicator && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="text-xs font-medium">Font Size</span>
          <div className="flex items-center gap-2">
            <button
              onClick={decreaseFontSize}
              disabled={fontSize <= MIN_FONT_SIZE}
              className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-mono">{fontSize}</span>
            <button
              onClick={increaseFontSize}
              disabled={fontSize >= MAX_FONT_SIZE}
              className="w-6 h-6 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              +
            </button>
          </div>
          <button
            onClick={resetFontSize}
            className="text-[10px] text-slate-400 hover:text-white ml-1"
          >
            Reset
          </button>
        </div>
      )}
    </>
  )
}



