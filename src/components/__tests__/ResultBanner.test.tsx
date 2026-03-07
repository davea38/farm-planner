import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultBanner } from '@/components/ResultBanner'

describe('ResultBanner', () => {
  it('renders green banner text', () => {
    render(<ResultBanner type="green" mainText="You save £54,880" subText="per year" />)
    expect(screen.getByText(/You save/)).toBeInTheDocument()
  })
})
