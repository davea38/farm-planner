import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveLoadToolbar } from '@/components/SaveLoadToolbar'

const twoMachines = [
  { name: 'Drill', machineType: 'drills' as const, inputs: { purchasePrice: 50000 } },
  { name: 'Sprayer', machineType: 'sprayers' as const, inputs: { purchasePrice: 80000 } },
]

describe('SaveLoadToolbar', () => {
  it('calls onLoad with the selected index when a profile is chosen', async () => {
    const user = userEvent.setup()
    const onLoad = vi.fn()
    render(
      <SaveLoadToolbar
        savedMachines={twoMachines}
        onSave={vi.fn()}
        onLoad={onLoad}
        onDelete={vi.fn()}
      />
    )
    await user.click(screen.getByText(/Load a saved machine/i))
    await user.click(screen.getByText('Sprayer'))
    expect(onLoad).toHaveBeenCalledWith(1)
  })

  it('re-fires onLoad after delete when selecting same index', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onLoad = vi.fn()
    const onDelete = vi.fn()
    const { rerender } = render(
      <SaveLoadToolbar
        savedMachines={twoMachines}
        onSave={vi.fn()}
        onLoad={onLoad}
        onDelete={onDelete}
      />
    )
    // Select index 0 ("Drill")
    await user.click(screen.getByText(/Load a saved machine/i))
    await user.click(screen.getByText('Drill'))
    expect(onLoad).toHaveBeenCalledWith(0)

    // Delete the selected machine
    await user.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalledWith(0)

    // Re-render with one machine remaining (Sprayer is now index 0)
    rerender(
      <SaveLoadToolbar
        savedMachines={[twoMachines[1]]}
        onSave={vi.fn()}
        onLoad={onLoad}
        onDelete={onDelete}
      />
    )

    // Select index 0 again (now "Sprayer") - onLoad MUST fire
    onLoad.mockClear()
    await user.click(screen.getByText(/Load a saved machine/i))
    await user.click(screen.getByText('Sprayer'))
    expect(onLoad).toHaveBeenCalledWith(0)
  })
})
