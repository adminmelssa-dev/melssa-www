import * as React from "react"

const MOBILE_BREAKPOINT = 768
const mobileMediaQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onStoreChange: () => void): () => void {
  const mediaQueryList = window.matchMedia(mobileMediaQuery)
  mediaQueryList.addEventListener("change", onStoreChange)

  return () => mediaQueryList.removeEventListener("change", onStoreChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(mobileMediaQuery).matches
}

function getServerSnapshot(): boolean {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
