import { useCallback, useEffect, useRef, useState } from 'react';

// Minimal Web Speech API typings (not in the standard TS DOM lib).
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const MAX_NETWORK_RETRIES = 3;

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseSpeechRecognition {
  supported: boolean;
  listening: boolean;
  finalTranscript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

// Wraps the browser Web Speech API into a React-friendly hook.
// Accumulates finalized text and exposes the in-progress interim text separately
// so the UI can show live "still being spoken" words.
export function useSpeechRecognition(onFinal?: (text: string) => void, lang = 'en-US'): UseSpeechRecognition {
  const onFinalRef = useRef(onFinal);
  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);
  const ctorRef = useRef<SpeechRecognitionConstructor | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Whether the user wants to keep listening; used to auto-restart on `onend`.
  const wantListeningRef = useRef(false);
  // Consecutive `network` errors; used to back off and eventually give up.
  const networkRetriesRef = useRef(0);
  // When set, the next auto-restart waits a beat (transient network recovery).
  const pendingRetryRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctor = getRecognitionCtor();
    ctorRef.current = ctor;
    setSupported(ctor !== null);
  }, []);

  const buildRecognition = useCallback(() => {
    const Ctor = ctorRef.current;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (!wantListeningRef.current) return;
      let interim = '';
      let finalAddition = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalAddition += text;
        } else {
          interim += text;
        }
      }
      if (finalAddition) {
        // A successful result means the speech service is reachable again.
        networkRetriesRef.current = 0;
        setError((prev) => (prev && prev.startsWith('Reconnecting') ? null : prev));
        setFinalTranscript((prev) => (prev + ' ' + finalAddition.trim()).trim());
        onFinalRef.current?.(finalAddition.trim());
      }
      setInterimTranscript(interim);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission denied. Allow mic access and try again.');
        wantListeningRef.current = false;
        return;
      }
      if (event.error === 'network') {
        // The Web Speech API streams audio to a cloud service; `network` means the
        // browser couldn't reach it (VPN, locked-down network/proxy, or offline).
        networkRetriesRef.current += 1;
        if (networkRetriesRef.current > MAX_NETWORK_RETRIES) {
          wantListeningRef.current = false;
          setError(
            "Couldn't reach the speech recognition service. This usually means a VPN, " +
              'a corporate/locked-down network, or no internet connection is blocking it. ' +
              'Try a different network — or type your thoughts in the box below.',
          );
        } else {
          pendingRetryRef.current = true;
          setError('Reconnecting to the speech service…');
        }
        return;
      }
      setError(event.message || `Speech recognition error: ${event.error}`);
    };

    rec.onend = () => {
      // The API stops on its own periodically; restart while the user wants to listen.
      if (wantListeningRef.current) {
        const delay = pendingRetryRef.current ? 800 : 0;
        pendingRetryRef.current = false;
        restartTimerRef.current = window.setTimeout(() => {
          try {
            rec.start();
          } catch {
            setListening(false);
          }
        }, delay);
        return;
      }
      setListening(false);
      setInterimTranscript('');
    };

    return rec;
  }, [lang]);

  const start = useCallback(() => {
    if (!ctorRef.current) return;
    setError(null);
    networkRetriesRef.current = 0;
    wantListeningRef.current = true;
    if (!recognitionRef.current) {
      recognitionRef.current = buildRecognition();
    }
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch {
      // start() throws if already started; ignore.
    }
  }, [buildRecognition]);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    pendingRetryRef.current = false;
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort();
    setListening(false);
    setInterimTranscript('');
  }, []);

  const reset = useCallback(() => {
    setFinalTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    supported,
    listening,
    finalTranscript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  };
}
