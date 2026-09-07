"use client";

import { useEffect, useRef, useState } from "react";
import {
  canRecognize,
  recognize,
  type RecognitionHandle,
} from "@/app/lib/speech";

interface MicButtonProps {
  /** Language code for the text being dictated. */
  lang: string;
  /** Called with the recognized text (live, then final). */
  onText: (text: string) => void;
  /** Called once when a dictation pass begins (e.g. to snapshot the field
   * for append-style dictation). */
  onStart?: () => void;
  className?: string;
}

/** A small toggle that dictates speech into a text field via the Web Speech
 * API. Renders nothing where recognition isn't supported (e.g. Firefox). */
export default function MicButton({
  lang,
  onText,
  onStart,
  className,
}: MicButtonProps) {
  const [listening, setListening] = useState(false);
  const handleRef = useRef<RecognitionHandle | null>(null);

  useEffect(() => () => handleRef.current?.stop(), []);

  if (!canRecognize()) return null;

  function toggle() {
    if (listening) {
      handleRef.current?.stop();
      return;
    }
    onStart?.();
    setListening(true);
    handleRef.current = recognize(lang, {
      onResult: (transcript) => {
        if (transcript.text) onText(transcript.text);
      },
      onError: () => {},
      onEnd: () => {
        setListening(false);
        handleRef.current = null;
      },
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Stop dictation" : "Dictate"}
      aria-pressed={listening}
      className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
        listening
          ? "animate-pulse bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
          : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      } ${className ?? ""}`}
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </svg>
    </button>
  );
}
