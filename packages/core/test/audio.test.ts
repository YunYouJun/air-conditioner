import type { AcAudioElement } from '../src'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { acSoundVolumes, createAcAudioController, soundTimings } from '../src'

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
