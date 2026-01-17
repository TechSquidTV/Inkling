'use client'

import * as React from 'react'

export function useDataState<T extends HTMLElement = HTMLElement>(
  key: string,
  forwardedRef?: React.Ref<T | null>,
  onChange?: (value: string | boolean | null) => void
): [string | boolean | null, React.RefObject<T | null>] {
  const localRef = React.useRef<T | null>(null)
  React.useImperativeHandle(forwardedRef, () => localRef.current as T)

  const getSnapshot = React.useCallback((): string | boolean | null => {
    const el = localRef.current
    if (!el) return null
    const value = el.getAttribute(`data-${key}`)
    if (value === null) return null
    if (value === '' || value === 'true') return true
    if (value === 'false') return false
    return value
  }, [key])

  const subscribe = React.useCallback(
    (callback: () => void) => {
      const el = localRef.current
      if (!el) return () => {}
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.attributeName === `data-${key}`) {
            callback()
            break
          }
        }
      })
      observer.observe(el, {
        attributes: true,
        attributeFilter: [`data-${key}`],
      })
      return () => observer.disconnect()
    },
    [key]
  )

  const value = React.useSyncExternalStore(subscribe, getSnapshot)

  React.useEffect(() => {
    if (onChange) onChange(value)
  }, [value, onChange])

  return [value, localRef]
}
