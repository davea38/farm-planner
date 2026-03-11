import { renderHook, act } from '@testing-library/react'
import { useHashRoute } from '../useHashRoute'

const VALID_TABS = [
  'machines',
  'cost-per-hectare',
  'cost-per-hour',
  'depreciation',
  'compare-machines',
  'replacement-planner',
  'contracting-income',
  'profitability',
]

describe('useHashRoute', () => {
  let pushStateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    window.location.hash = ''
    pushStateSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
  })

  afterEach(() => {
    window.location.hash = ''
    pushStateSpy.mockRestore()
  })

  it('returns "machines" by default when no hash is present', () => {
    const { result } = renderHook(() => useHashRoute())
    expect(result.current.activeTab).toBe('machines')
  })

  it('returns the correct tab when a valid hash is present', () => {
    window.location.hash = '#depreciation'
    const { result } = renderHook(() => useHashRoute())
    expect(result.current.activeTab).toBe('depreciation')
  })

  it('returns "machines" for an invalid hash', () => {
    window.location.hash = '#nonexistent-tab'
    const { result } = renderHook(() => useHashRoute())
    expect(result.current.activeTab).toBe('machines')
  })

  it('setActiveTab updates the activeTab value', () => {
    const { result } = renderHook(() => useHashRoute())

    act(() => {
      result.current.setActiveTab('profitability')
    })

    expect(result.current.activeTab).toBe('profitability')
  })

  it('setActiveTab pushes to history for a non-default tab', () => {
    const { result } = renderHook(() => useHashRoute())

    act(() => {
      result.current.setActiveTab('cost-per-hour')
    })

    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '#cost-per-hour')
  })

  it('setActiveTab uses pathname (no hash) for the "machines" default tab', () => {
    window.location.hash = '#depreciation'
    const { result } = renderHook(() => useHashRoute())

    act(() => {
      result.current.setActiveTab('machines')
    })

    expect(pushStateSpy).toHaveBeenCalledWith(null, '', window.location.pathname)
    expect(result.current.activeTab).toBe('machines')
  })

  it('updates activeTab when a hashchange event is dispatched', () => {
    const { result } = renderHook(() => useHashRoute())
    expect(result.current.activeTab).toBe('machines')

    act(() => {
      window.location.hash = '#contracting-income'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    expect(result.current.activeTab).toBe('contracting-income')
  })

  it('falls back to "machines" on hashchange with an invalid hash', () => {
    window.location.hash = '#profitability'
    const { result } = renderHook(() => useHashRoute())
    expect(result.current.activeTab).toBe('profitability')

    act(() => {
      window.location.hash = '#invalid'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    expect(result.current.activeTab).toBe('machines')
  })

  it.each(VALID_TABS)('recognizes "%s" as a valid tab', (tab) => {
    window.location.hash = `#${tab}`
    const { result } = renderHook(() => useHashRoute())
    expect(result.current.activeTab).toBe(tab)
  })
})
