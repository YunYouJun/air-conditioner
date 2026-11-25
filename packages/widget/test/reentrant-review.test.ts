// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { mountAirConditioner } from '../src'

it('emits one change when the consumer reparents the widget during that change', () => {
  const a = document.body.appendChild(document.createElement('div'))
  const b = document.body.appendChild(document.createElement('div'))
  const widget = mountAirConditioner(a, {
    tagName: 'review-reentrant-move',
    storage: null,
    enableAudio: false,
    initialState: { status: false, mode: 'cold', temperature: 24 },
  })
  let changes = 0
  widget.addEventListener('ac-change', () => {
    changes++
    if (changes === 1)
      b.appendChild(widget)
  })
  try {
    widget.shadowRoot!.querySelector<HTMLButtonElement>('[data-action="toggleStatus"]')!.click()
    expect(changes).toBe(1)
  }
  finally {
    a.remove()
    b.remove()
  }
})
