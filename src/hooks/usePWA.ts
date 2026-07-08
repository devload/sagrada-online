import { useEffect, useState } from 'react'

/**
 * Detect PWA install state + provide an install prompt handle.
 *
 * - `isInstalled`: true when running as PWA (matchMedia standalone or iOS navigator.standalone)
 * - `canInstall`: true when Chrome/Edge fired beforeinstallprompt (native install available)
 * - `platform`: 'ios' | 'android' | 'desktop' | 'other' — used to show the correct instructions
 * - `install()`: triggers the native install prompt (only on Chrome/Android after beforeinstallprompt)
 */

type Platform = 'ios' | 'android' | 'desktop' | 'other'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<Platform>('other')

  useEffect(() => {
    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    const isAndroid = /Android/i.test(ua)
    const isDesktop = !isIOS && !isAndroid && !/Mobi/i.test(ua)
    setPlatform(isIOS ? 'ios' : isAndroid ? 'android' : isDesktop ? 'desktop' : 'other')

    // Standalone detection
    const mm = window.matchMedia('(display-mode: standalone)')
    const check = () => {
      const standaloneAlt = (window.navigator as unknown as { standalone?: boolean }).standalone === true
      setIsInstalled(mm.matches || standaloneAlt)
    }
    check()
    mm.addEventListener('change', check)

    // Chrome/Edge/Android install prompt event
    const onBefore = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBefore)

    // Cleanup once installed
    const onInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      mm.removeEventListener('change', check)
      window.removeEventListener('beforeinstallprompt', onBefore)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') setIsInstalled(true)
    setDeferredPrompt(null)
  }

  return {
    isInstalled,
    canInstall: deferredPrompt !== null,
    platform,
    install,
  }
}
