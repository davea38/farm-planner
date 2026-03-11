import { useState, useEffect, useCallback } from 'react'

const VALID_TABS = new Set([
  'machines',
  'cost-per-hectare',
  'cost-per-hour',
  'cost-calculator',
  'depreciation',
  'compare-machines',
  'replacement-planner',
  'contracting-income',
  'profitability',
])

const DEFAULT_TAB = 'machines'

function getTabFromHash(): string {
  const hash = window.location.hash.replace('#', '')
  return VALID_TABS.has(hash) ? hash : DEFAULT_TAB
}

export function useHashRoute() {
  const [activeTab, setActiveTabState] = useState(getTabFromHash)

  // Listen for back/forward navigation
  useEffect(() => {
    const onHashChange = () => {
      setActiveTabState(getTabFromHash())
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Set tab and update hash
  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab)
    const newHash = tab === DEFAULT_TAB ? '' : `#${tab}`
    if (window.location.hash !== `#${tab}`) {
      window.history.pushState(null, '', newHash || window.location.pathname)
    }
  }, [])

  return { activeTab, setActiveTab }
}
