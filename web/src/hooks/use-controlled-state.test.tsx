import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useControlledState } from './use-controlled-state'

describe('useControlledState', () => {
  it('uses defaultValue when value is not provided', () => {
    const { result } = renderHook(() =>
      useControlledState({ defaultValue: 'default' })
    )

    expect(result.current[0]).toBe('default')
  })

  it('uses value when provided', () => {
    const { result } = renderHook(() =>
      useControlledState({ value: 'controlled', defaultValue: 'default' })
    )

    expect(result.current[0]).toBe('controlled')
  })

  it('updates state when setter is called', () => {
    const { result } = renderHook(() =>
      useControlledState({ defaultValue: 'initial' })
    )

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
  })

  it('calls onChange callback when state is updated', () => {
    let callbackValue: string | undefined
    const onChange = (value: string) => {
      callbackValue = value
    }

    const { result } = renderHook(() =>
      useControlledState({ defaultValue: 'initial', onChange })
    )

    act(() => {
      result.current[1]('new-value')
    })

    expect(callbackValue).toBe('new-value')
  })

  it('syncs with controlled value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useControlledState({ value }),
      { initialProps: { value: 'first' } }
    )

    expect(result.current[0]).toBe('first')

    rerender({ value: 'second' })

    expect(result.current[0]).toBe('second')
  })

  it('does not update when value prop changes if already uncontrolled', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value?: string }) =>
        useControlledState({ value, defaultValue: 'default' }),
      { initialProps: { value: undefined as string | undefined } }
    )

    // Start uncontrolled
    expect(result.current[0]).toBe('default')

    act(() => {
      result.current[1]('user-change')
    })

    expect(result.current[0]).toBe('user-change')

    // Changing value prop when started uncontrolled
    rerender({ value: 'controlled' })

    // Should sync to controlled value
    expect(result.current[0]).toBe('controlled')
  })

  it('handles additional arguments in onChange callback', () => {
    let capturedArgs: [string, number, boolean] | undefined

    const onChange = (value: string, num: number, bool: boolean) => {
      capturedArgs = [value, num, bool]
    }

    const { result } = renderHook(() =>
      useControlledState<string, [number, boolean]>({
        defaultValue: 'initial',
        onChange,
      })
    )

    act(() => {
      result.current[1]('test', 42, true)
    })

    expect(capturedArgs).toEqual(['test', 42, true])
  })

  it('works with different types', () => {
    // Test with numbers
    const { result: numberResult } = renderHook(() =>
      useControlledState({ defaultValue: 0 })
    )

    expect(numberResult.current[0]).toBe(0)

    act(() => {
      numberResult.current[1](42)
    })

    expect(numberResult.current[0]).toBe(42)

    // Test with booleans
    const { result: boolResult } = renderHook(() =>
      useControlledState({ defaultValue: false })
    )

    expect(boolResult.current[0]).toBe(false)

    act(() => {
      boolResult.current[1](true)
    })

    expect(boolResult.current[0]).toBe(true)

    // Test with objects
    const { result: objectResult } = renderHook(() =>
      useControlledState({ defaultValue: { count: 0 } })
    )

    expect(objectResult.current[0]).toEqual({ count: 0 })

    act(() => {
      objectResult.current[1]({ count: 5 })
    })

    expect(objectResult.current[0]).toEqual({ count: 5 })
  })
})
