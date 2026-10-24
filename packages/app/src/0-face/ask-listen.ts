type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type RecognitionClass = new () => Recognition

function recognitionClass(): RecognitionClass | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

/** Whether this browser can listen at all. */
export function canListen(): boolean {
  return recognitionClass() !== null
}

const FAILURES: Record<string, string> = {
  'not-allowed': 'The microphone is not allowed for this site.',
  'service-not-allowed': 'The microphone is not allowed for this site.',
  'audio-capture': 'No microphone was found.',
  network: 'Listening needs a connection.',
}

export type Listening = { stop(): void; abort(): void }

/**
 * Listen until the person stops speaking. `heard` has everything heard so far;
 * `end` comes once, with what went wrong or null.
 */
export function listen(options: { lang: string; heard: (words: string) => void; end: (failure: string | null) => void }): Listening | null {
  const Recognition = recognitionClass()
  if (!Recognition) return null
  const recognition = new Recognition()
  recognition.lang = options.lang
  recognition.continuous = false
  recognition.interimResults = true
  let failure: string | null = null
  let ended = false
  recognition.onresult = (event) => {
    let words = ''
    for (let index = 0; index < event.results.length; index++) words += event.results[index][0]?.transcript ?? ''
    options.heard(words.replace(/\s+/g, ' ').trim())
  }
  recognition.onerror = (event) => {
    if (event.error !== 'aborted' && event.error !== 'no-speech') failure = FAILURES[event.error] ?? 'Listening stopped.'
  }
  recognition.onend = () => {
    if (ended) return
    ended = true
    options.end(failure)
  }
  try {
    recognition.start()
  } catch {
    return null
  }
  return {
    stop: () => recognition.stop(),
    abort: () => {
      ended = true
      recognition.abort()
    },
  }
}
