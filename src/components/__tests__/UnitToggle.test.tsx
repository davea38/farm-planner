import { render, screen, fireEvent } from '@testing-library/react'
import { UnitToggle } from '@/components/UnitToggle'

describe('UnitToggle', () => {
  it('renders ha/acres toggle', () => {
    render(<UnitToggle units={{ area: 'ha', speed: 'km' }} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /^ha$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /acres/i })).toBeInTheDocument()
  })

  it('renders km/miles toggle', () => {
    render(<UnitToggle units={{ area: 'ha', speed: 'km' }} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /^km$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /miles/i })).toBeInTheDocument()
  })

  it('highlights active area unit with aria-pressed', () => {
    render(<UnitToggle units={{ area: 'acres', speed: 'km' }} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /acres/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^ha$/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('highlights active speed unit with aria-pressed', () => {
    render(<UnitToggle units={{ area: 'ha', speed: 'miles' }} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /miles/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^km$/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with updated area when area toggled', () => {
    const onChange = vi.fn()
    render(<UnitToggle units={{ area: 'ha', speed: 'km' }} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /acres/i }))
    expect(onChange).toHaveBeenCalledWith({ area: 'acres', speed: 'km' })
  })

  it('calls onChange with updated speed when speed toggled', () => {
    const onChange = vi.fn()
    render(<UnitToggle units={{ area: 'ha', speed: 'km' }} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /miles/i }))
    expect(onChange).toHaveBeenCalledWith({ area: 'ha', speed: 'miles' })
  })
})
