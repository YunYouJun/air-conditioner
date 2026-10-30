import type { AcAudioElement } from '../src'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { acFanSoundLevels, acSoundVolumes, createAcAudioController, soundTimings } from '../src'

function fakeElement(src: string) {
  return {
    src,
    currentTime: 0,
    volume: 1,
    muted: false,
    loop: false,
    load: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
  } satisfies AcAudioElement
}

function fakeElements() {
  return {
    beep: fakeElement('/audio/di.m4a'),
    start: fakeElement('/audio/ac-work.m4a'),
    work: fakeElement('/audio/air-extractor-fan.m4a'),
  }
}

function fakeParam(value = 1) {
  return {
    value,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    setValueCurveAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  }
}

function fakeGainNode() {
  return { gain: fakeParam(), connect: vi.fn(), disconnect: vi.fn() }
}

function fakeBufferSource() {
  return {
    buffer: null as { duration: number, name: string } | null,
    onended: null as (() => void) | null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
}

/**
 * Just enough of `AudioContext` to record what the controller schedules.
 */
function fakeAudioContext() {
  const gains: ReturnType<typeof fakeGainNode>[] = []
  const sources: ReturnType<typeof fakeBufferSource>[] = []

  const context = {
    currentTime: 0,
    state: 'running',
    destination: {},
    createGain() {
      const node = fakeGainNode()
      gains.push(node)
      return node
    },
    createBufferSource() {
      const node = fakeBufferSource()
      sources.push(node)
      return node
    },
    decodeAudioData: vi.fn(async (data: ArrayBuffer) => {
      const name = new TextDecoder().decode(data)
      return { name, duration: name.includes('fan') ? 12 : name.includes('work') ? 9 : 0.3 }
    }),
    resume: vi.fn(),
    close: vi.fn(),
  }

  return { context, gains, sources }
}

function webOptions(fake: ReturnType<typeof fakeAudioContext>) {
  return {
    createAudioContext: () => fake.context as unknown as AudioContext,
    loadAudioData: async (url: string) => new TextEncoder().encode(url).buffer as ArrayBuffer,
    random: () => 0,
  }
}

describe('createAcAudioController with <audio> elements', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('plays the start sound, then loops the fan', () => {
    const elements = fakeElements()
    const controller = createAcAudioController(elements, { webAudio: false })

    controller.toggleStatusAudio(false)
    expect(elements.start.play).toHaveBeenCalledTimes(1)
    expect(elements.work.play).not.toHaveBeenCalled()

    vi.advanceTimersByTime(soundTimings.startDelayMs)
    expect(elements.work.play).toHaveBeenCalledTimes(1)
    expect(elements.work.loop).toBe(true)

    vi.advanceTimersByTime(soundTimings.loopCrossfadeMs)
    expect(elements.work.volume).toBeCloseTo(1)
  })

  it('quiets the fan once the room has settled', () => {
    const elements = fakeElements()
    const controller = createAcAudioController(elements, { webAudio: false, random: () => 0 })

    controller.toggleStatusAudio(false)
    vi.advanceTimersByTime(soundTimings.startDelayMs + soundTimings.settleAfterMs + soundTimings.settleRampMs)
    expect(elements.work.volume).toBeCloseTo(soundTimings.settleLevel)

    vi.advanceTimersByTime(soundTimings.quietDurationMs[0] + soundTimings.surgeRampMs)
    expect(elements.work.volume).toBeCloseTo(soundTimings.surgeLevel)
  })

  // #29: fixed fan speeds hold a steady level; auto keeps the settle cycle.
  it('holds the fan sound steady at a fixed speed', () => {
    const elements = fakeElements()
    const controller = createAcAudioController(elements, { webAudio: false, fanSpeed: 'low', random: () => 0 })

    controller.toggleStatusAudio(false)
    vi.advanceTimersByTime(soundTimings.startDelayMs + soundTimings.loopCrossfadeMs)
    expect(elements.work.volume).toBeCloseTo(acFanSoundLevels.low)
    // No settle / surge while the speed is fixed.
    vi.advanceTimersByTime(soundTimings.settleAfterMs + soundTimings.settleRampMs + soundTimings.quietDurationMs[0] + soundTimings.surgeRampMs)
    expect(elements.work.volume).toBeCloseTo(acFanSoundLevels.low)

    controller.setFanSpeed('high')
    vi.advanceTimersByTime(soundTimings.loopCrossfadeMs)
    expect(elements.work.volume).toBeCloseTo(acFanSoundLevels.high)

    // Back to auto: full, then the usual settle.
    controller.setFanSpeed('auto')
    vi.advanceTimersByTime(soundTimings.settleAfterMs + soundTimings.settleRampMs)
    expect(elements.work.volume).toBeCloseTo(soundTimings.settleLevel)
  })

  it('starts the fan loop at a speed chosen during start-up', () => {
    const elements = fakeElements()
    const controller = createAcAudioController(elements, { webAudio: false })

    controller.toggleStatusAudio(false)
    controller.setFanSpeed('medium')
    vi.advanceTimersByTime(soundTimings.startDelayMs + soundTimings.loopCrossfadeMs)
    expect(elements.work.volume).toBeCloseTo(acFanSoundLevels.medium)
  })

  it('fades out and stops when powered off', () => {
    const elements = fakeElements()
    const controller = createAcAudioController(elements, { webAudio: false })

    controller.toggleStatusAudio(false)
    vi.advanceTimersByTime(soundTimings.startDelayMs + soundTimings.loopCrossfadeMs)
    controller.toggleStatusAudio(true)
    expect(elements.start.pause).toHaveBeenCalled()

    vi.advanceTimersByTime(soundTimings.stopFadeMs)
    expect(elements.work.pause).toHaveBeenCalled()
    expect(elements.work.volume).toBeCloseTo(0)
  })

  it('replays the beep without reloading the file', () => {
    const elements = fakeElements()
    const controller = createAcAudioController(elements, { webAudio: false })

    controller.beep()
    expect(elements.beep.pause).not.toHaveBeenCalled()
    expect(elements.beep.play).toHaveBeenCalledTimes(1)
    expect(elements.beep.load).not.toHaveBeenCalled()

    elements.beep.currentTime = 0.4
    controller.beep()
    expect(elements.beep.pause).toHaveBeenCalledTimes(1)
    expect(elements.beep.currentTime).toBe(0)
    expect(elements.beep.play).toHaveBeenCalledTimes(2)
    expect(elements.beep.load).not.toHaveBeenCalled()
    controller.dispose()
  })

  it('follows the sound mode', () => {
    const elements = fakeElements()
    const controller = createAcAudioController(elements, { webAudio: false, soundMode: 'sleep' })

    controller.beep()
    expect(elements.beep.volume).toBeCloseTo(acSoundVolumes.sleep)

    controller.setSoundMode('mute')
    controller.beep()
    expect(elements.beep.play).toHaveBeenCalledTimes(1)
    expect(elements.work.muted).toBe(true)

    controller.setSoundMode('normal')
    expect(elements.beep.volume).toBe(1)
    expect(elements.work.muted).toBe(false)
  })

  it('keeps working with elements that only implement the original API', () => {
    const work = { currentTime: 0, load: vi.fn(), play: vi.fn() }
    const controller = createAcAudioController({ start: null, work }, { webAudio: false })

    controller.toggleStatusAudio(false)
    vi.advanceTimersByTime(soundTimings.startDelayMs)
    expect(work.play).toHaveBeenCalledTimes(1)

    // Without pause(), stopping falls back to load()
    const loads = work.load.mock.calls.length
    controller.toggleStatusAudio(true)
    vi.advanceTimersByTime(soundTimings.stopFadeMs)
    expect(work.load).toHaveBeenCalledTimes(loads + 1)
    controller.dispose()
  })
})

describe('createAcAudioController with Web Audio', () => {
  it('crossfades the fan loop after the start sound', async () => {
    vi.useFakeTimers()
    const fake = fakeAudioContext()
    const controller = createAcAudioController(fakeElements(), webOptions(fake))

    controller.toggleStatusAudio(false)
    await vi.advanceTimersByTimeAsync(0)

    const [start, fan] = fake.sources
    expect(start.buffer?.name).toContain('ac-work')
    expect(start.start).toHaveBeenCalledWith(0)
    expect(fan.buffer?.name).toContain('fan')
    expect(fan.start).toHaveBeenCalledWith(soundTimings.startDelayMs / 1000)

    // The next fan segment starts before the current one ends
    fake.context.currentTime = 18
    await vi.advanceTimersByTimeAsync(20_000)
    const crossfade = soundTimings.loopCrossfadeMs / 1000
    expect(fake.sources[2].start).toHaveBeenCalledWith(soundTimings.startDelayMs / 1000 + 12 - crossfade)

    controller.dispose()
    vi.useRealTimers()
  })

  it('ramps the fan down after settling and fades out on power off', async () => {
    vi.useFakeTimers()
    const fake = fakeAudioContext()
    const controller = createAcAudioController(fakeElements(), webOptions(fake))

    controller.toggleStatusAudio(false)
    await vi.advanceTimersByTimeAsync(0)
    // master, run output, fan level
    const [, output, fanLevel] = fake.gains

    await vi.advanceTimersByTimeAsync(soundTimings.startDelayMs + soundTimings.settleAfterMs)
    expect(fanLevel.gain.linearRampToValueAtTime).toHaveBeenCalledWith(soundTimings.settleLevel, expect.any(Number))

    controller.toggleStatusAudio(true)
    expect(output.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, expect.any(Number))

    controller.dispose()
    expect(fake.context.close).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('sets the master volume from the sound mode and skips beeps when muted', async () => {
    const fake = fakeAudioContext()
    const elements = fakeElements()
    const controller = createAcAudioController(elements, { ...webOptions(fake), soundMode: 'sleep' })

    controller.beep()
    const master = fake.gains[0]
    expect(master.gain.value).toBe(acSoundVolumes.sleep)

    controller.setSoundMode('mute')
    expect(master.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, expect.any(Number), expect.any(Number))

    const played = fake.sources.length + elements.beep.play.mock.calls.length
    controller.beep()
    expect(fake.sources.length + elements.beep.play.mock.calls.length).toBe(played)
    controller.dispose()
  })

  async function drain() {
    for (let i = 0; i < 20; i++)
      await Promise.resolve()
  }

  it('decodes the beep ahead of the first press and does not fetch it again', async () => {
    const fake = fakeAudioContext()
    const elements = fakeElements()
    const load = vi.fn(async (url: string) => new TextEncoder().encode(url).buffer as ArrayBuffer)
    const controller = createAcAudioController(elements, { ...webOptions(fake), loadAudioData: load })

    // Fetch starts when the controller is created, before any press.
    expect(load.mock.calls.map(call => call[0])).toEqual([
      elements.beep.src,
      elements.start.src,
      elements.work.src,
    ])
    await drain()

    elements.beep.load.mockClear()
    elements.beep.play.mockClear()
    controller.beep()
    controller.beep()

    const beeps = fake.sources.filter(source => source.buffer?.name.includes('di'))
    expect(beeps).toHaveLength(2)
    expect(beeps[0].start).toHaveBeenCalledWith(0)
    expect(elements.beep.play).not.toHaveBeenCalled()
    expect(elements.beep.load).not.toHaveBeenCalled()
    expect(load).toHaveBeenCalledTimes(3)
    controller.dispose()
  })

  it('plays the preloaded element while the beep buffer is still decoding', async () => {
    const fake = fakeAudioContext()
    const elements = fakeElements()
    let release: (data: ArrayBuffer) => void = () => {}
    const gate = new Promise<ArrayBuffer>((resolve) => {
      release = resolve
    })
    const load = vi.fn(() => gate)
    const controller = createAcAudioController(elements, { ...webOptions(fake), loadAudioData: load })

    controller.beep()
    expect(elements.beep.play).toHaveBeenCalledTimes(1)
    expect(elements.beep.load).not.toHaveBeenCalled()
    expect(fake.sources).toHaveLength(0)
    expect(load).toHaveBeenCalledTimes(3)

    release(new TextEncoder().encode('di').buffer)
    await drain()
    // Decoding must not play a beep by itself.
    expect(fake.sources).toHaveLength(0)

    controller.beep()
    expect(fake.sources).toHaveLength(1)
    expect(fake.sources[0].buffer?.name).toContain('di')
    expect(elements.beep.play).toHaveBeenCalledTimes(1)
    expect(elements.beep.load).not.toHaveBeenCalled()
    expect(load).toHaveBeenCalledTimes(3)
    controller.dispose()
  })

  it('resumes a suspended context on pointerdown, before the click plays the beep', () => {
    const fake = fakeAudioContext()
    fake.context.state = 'suspended'
    const listeners = new Map<string, EventListener>()
    const previous = globalThis.document
    vi.stubGlobal('document', {
      addEventListener(type: string, listener: EventListener) {
        listeners.set(type, listener)
      },
      removeEventListener(type: string) {
        listeners.delete(type)
      },
    })

    try {
      const controller = createAcAudioController(fakeElements(), webOptions(fake))
      expect(fake.context.resume).not.toHaveBeenCalled()
      listeners.get('pointerdown')?.({} as Event)
      expect(fake.context.resume).toHaveBeenCalledTimes(1)
      expect(listeners.has('pointerdown')).toBe(false)
      controller.dispose()
    }
    finally {
      if (previous === undefined)
        vi.unstubAllGlobals()
      else
        vi.stubGlobal('document', previous)
    }
  })

  it('falls back to <audio> when the files cannot be decoded', async () => {
    vi.useFakeTimers()
    const fake = fakeAudioContext()
    fake.context.decodeAudioData.mockRejectedValue(new Error('unsupported'))
    const elements = fakeElements()
    const controller = createAcAudioController(elements, webOptions(fake))

    controller.toggleStatusAudio(false)
    await vi.advanceTimersByTimeAsync(0)

    expect(fake.sources).toHaveLength(0)
    expect(elements.start.play).toHaveBeenCalledTimes(1)
    controller.dispose()
    vi.useRealTimers()
  })
})

// #21
describe('drip', () => {
  function withOscillators(fake: ReturnType<typeof fakeAudioContext>) {
    const oscillators: { frequency: ReturnType<typeof fakeParam>, start: ReturnType<typeof vi.fn>, stop: ReturnType<typeof vi.fn> }[] = []
    Object.assign(fake.context, {
      createOscillator() {
        const node = { type: 'sine', frequency: fakeParam(), connect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null }
        oscillators.push(node)
        return node
      },
    })
    return oscillators
  }

  it('plays a short synthesized drop in the normal sound mode only', () => {
    const fake = fakeAudioContext()
    const oscillators = withOscillators(fake)
    const controller = createAcAudioController(fakeElements(), webOptions(fake))

    controller.drip()
    expect(oscillators).toHaveLength(1)
    expect(oscillators[0].start).toHaveBeenCalledTimes(1)
    expect(oscillators[0].stop).toHaveBeenCalledTimes(1)

    controller.setSoundMode('sleep')
    controller.drip()
    controller.setSoundMode('mute')
    controller.drip()
    expect(oscillators).toHaveLength(1)
    controller.dispose()
  })

  it('does not queue drips before the context is running', () => {
    const fake = fakeAudioContext()
    fake.context.state = 'suspended'
    const oscillators = withOscillators(fake)
    const controller = createAcAudioController(fakeElements(), webOptions(fake))

    controller.drip()
    expect(oscillators).toHaveLength(0)

    fake.context.state = 'running'
    controller.drip()
    expect(oscillators).toHaveLength(1)
    controller.dispose()
  })

  it('stays silent without Web Audio', () => {
    const elements = fakeElements()
    const controller = createAcAudioController(elements, { webAudio: false })
    controller.drip()
    expect(elements.beep.play).not.toHaveBeenCalled()
    controller.dispose()
  })
})
