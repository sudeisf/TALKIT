'use client';

import { useEffect, useRef, useState, forwardRef, type ForwardedRef } from 'react';
import { Smile, Paperclip, Mic, Send, Play, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmojiPicker from 'emoji-picker-react';

type VoiceRecorderHandle = {
  startRecording: () => void;
  stopRecording: () => void;
  cancel: () => void;
};

type VoiceRecorderProps = {
  onRecordingComplete?: (audioBlob: Blob) => void;
  onCancel?: () => void;
  className?: string;
};

const VoiceRecorder = forwardRef(function VoiceRecorder(
  { onRecordingComplete, onCancel, className }: VoiceRecorderProps,
  ref: ForwardedRef<VoiceRecorderHandle>
) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(
    [0.2, 0.4, 0.6, 0.8, 0.5, 0.3, 0.7, 0.9, 0.6, 0.4, 0.2, 0.5, 0.7, 0.4, 0.3]
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isCancellingRef = useRef(false); // <-- new flag to prevent recursion

  useEffect(() => {
    // expose control methods to parent
    if (!ref) return;
    const handle: VoiceRecorderHandle = {
      startRecording: () => {
        if (!isRecording) void startRecordingInternal();
      },
      stopRecording: () => {
        stopRecordingInternal();
      },
      cancel: () => {
        cancelInternal();
      },
    };
    if (typeof ref === 'function') ref(handle);
    else ref.current = handle;
  }, [ref, isRecording]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecordingInternal = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 64;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      isCancellingRef.current = false; // reset cancel flag for this session

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // if we are cancelling, skip normal onstop logic to avoid recursion / double-calls
        if (isCancellingRef.current) {
          chunksRef.current = [];
          return;
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete?.(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      visualizeRecording();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecordingInternal = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancellingRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const cancelInternal = () => {
    // mark as cancelling so onstop knows to skip normal handling
    isCancellingRef.current = true;

    // stop recorder, close stream, clear audio and waveform
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setIsRecording(false);
    setIsPlaying(false);
    setAudioUrl(null);
    setDuration(0);
    setCurrentTime(0);
    setWaveformData([
      0.2, 0.4, 0.6, 0.8, 0.5, 0.3, 0.7, 0.9, 0.6, 0.4, 0.2, 0.5, 0.7, 0.4, 0.3,
    ]);

    // 6. Notify parent so it hides the recording UI
    onCancel?.();
  };

  const visualizeRecording = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const update = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      const bars = waveformData.length;
      const step = Math.max(1, Math.floor(dataArray.length / bars));
      const next: number[] = [];

      for (let i = 0; i < bars; i++) {
        const raw = dataArray[i * step] / 255;
        next.push(0.2 + raw * 0.8);
      }

      setWaveformData(next);
      animationFrameRef.current = requestAnimationFrame(update);
    };

    update();
  };

  const togglePlayback = () => {
    if (!audioUrl || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (secs: number) => {
    const s = Math.floor(secs % 60)
      .toString()
      .padStart(2, '0');
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className={`flex items-center gap-3 w-full ${className ?? ''}`}>
      {/* full-width recorder bar filling input area */}
      <div className="flex items-center gap-3 flex-1 bg-white rounded-2xl shadow-sm border border-neutral-200 px-4 py-3">
        {/* left icon / avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Mic className="w-4 h-4 text-primary" />
        </div>

        {/* center: play/stop and waveform */}
        <button
          onClick={
            audioUrl && !isRecording
              ? togglePlayback
              : isRecording
              ? stopRecordingInternal
              : startRecordingInternal
          }
          className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-primary-foreground flex items-center justify-center"
          aria-label={
            isRecording
              ? 'Stop recording'
              : audioUrl
              ? 'Play recording'
              : 'Start recording'
          }
        >
          {isRecording ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : audioUrl && isPlaying ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : audioUrl ? (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="flex flex-col gap-1 flex-1">
          {/* line visualizer, take full width */}
          <div className="flex items-center gap-[3px] h-7 w-full">
            {waveformData.map((value, index) => {
              const baseHeight = value;
              const heightPct = 25 + baseHeight * 55;
              let barColor = 'var(--muted-foreground)';

              if (isRecording) {
                barColor = 'var(--primary)';
              } else if (audioUrl && duration > 0) {
                const isPlayed = index / waveformData.length < progress;
                barColor = isPlayed ? 'var(--primary)' : 'var(--muted-foreground)';
              }

              return (
                <div
                  key={index}
                  style={{
                    width: 2,
                    borderRadius: 9999,
                    backgroundColor: barColor,
                    height: `${heightPct}%`,
                    minHeight: '20%',
                  }}
                />
              );
            })}
          </div>
          <span className="text-[11px] text-neutral-500">
            {isRecording
              ? 'Recording...'
              : audioUrl
              ? formatTime(currentTime || duration)
              : 'Ready to record'}
          </span>
        </div>

        {/* right: red bin to cancel */}
        <button
          onClick={cancelInternal}
          className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-danger/10"
          aria-label="Delete voice message"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          className="hidden"
        />
      )}
    </div>
  );
});

type MessageInputProps = {
  onVoiceMessage?: (audioBlob: Blob) => void;
  onSendMessage?: (payload: OutgoingChatMessage, optimistic?: OptimisticMessage) => void;
  onSendText?: (text: string) => void;
};

export type OutgoingChatMessage = {
  type: 'message';
  message: string;
  message_type: 'text' | 'code' | 'audio' | 'voice' | 'image' | 'link' | 'document' | 'other';
  code_snippet?: string;
  code_language?: string;
  audio_base64?: string;
  file_base64?: string;
  file_name?: string;
};

export type OptimisticMessage = {
  name: string;
  type?: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  audioUrl?: string;
};

const CODE_FENCE_REGEX = /```([\w#+.-]*)\n([\s\S]*?)```/m;

function detectCodePayload(rawMessage: string): OutgoingChatMessage {
  const trimmed = rawMessage.trim();
  const fenced = trimmed.match(CODE_FENCE_REGEX);

  if (fenced) {
    const language = fenced[1]?.trim() || undefined;
    const snippet = fenced[2]?.trim();
    if (snippet) {
      return {
        type: 'message',
        message: 'Code snippet',
        message_type: 'code',
        code_snippet: snippet,
        code_language: language,
      };
    }
  }

  const looksMultiline = trimmed.includes('\n');
  const codeIndicators = [
    '=>',
    'function ',
    'const ',
    'let ',
    'var ',
    'class ',
    'def ',
    'import ',
    'return ',
    '{',
    '}',
    ';',
    '</',
  ];

  const indicatorCount = codeIndicators.reduce(
    (count, indicator) => count + (trimmed.includes(indicator) ? 1 : 0),
    0
  );

  if (looksMultiline && indicatorCount >= 2) {
    return {
      type: 'message',
      message: 'Code snippet',
      message_type: 'code',
      code_snippet: trimmed,
    };
  }

  return {
    type: 'message',
    message: trimmed,
    message_type: 'text',
  };
}

export function MessageInput({
  onVoiceMessage,
  onSendMessage,
  onSendText,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const voiceRecorderRef = useRef<VoiceRecorderHandle | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const isImg = file.type.startsWith('image/');
      const msgType = isImg ? 'image' : 'document';

      onSendMessage?.(
        {
          type: 'message',
          message: file.name,
          message_type: msgType,
          file_base64: base64Data,
          file_name: file.name,
        },
        // Optimistic preview — shown immediately while server saves
        {
          name: '',
          type: msgType,
          text: file.name,
          fileUrl: base64Data,   // use local data URL as instant preview
          fileName: file.name,
        }
      );
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendText = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const payload = detectCodePayload(trimmed);
    onSendMessage?.(payload);
    onSendText?.(trimmed);

    setMessage('');
  };

  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    onVoiceMessage?.(audioBlob);

    // Create a local object URL for immediate playback preview
    const localAudioUrl = URL.createObjectURL(audioBlob);

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      onSendMessage?.(
        {
          type: 'message',
          message: 'Voice message',
          message_type: 'voice',
          audio_base64: base64Data,
          file_name: 'voice-message.webm',
        },
        // Optimistic preview — shown immediately while server saves
        {
          name: '',
          type: 'voice',
          text: 'Voice message',
          audioUrl: localAudioUrl,
          fileName: 'voice-message.webm',
        }
      );
    };
    reader.readAsDataURL(audioBlob);

    setIsRecording(false); // back to normal input UI
  };

  const handleMicClick = () => {
    // only enter recording mode if there is no text
    if (message.trim()) return;
    setIsRecording(true);
    // start recording once the component is mounted
    setTimeout(() => {
      voiceRecorderRef.current?.startRecording();
    }, 0);
  };

  const handleCancelVoice = () => {
    voiceRecorderRef.current?.cancel();
    setIsRecording(false);
  };

  // if user starts typing while recorder is open, exit recording UI
  const handleChangeMessage = (value: string) => {
    setMessage(value);
    if (value.trim() && isRecording) {
      handleCancelVoice();
    }
  };

  return (
    <div className="w-full max-w-full mx-auto p-4">
      <div className="relative flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-3 border border-border">
        {isRecording ? (
          // recording view takes whole input row
          <VoiceRecorder
            ref={voiceRecorderRef}
            onRecordingComplete={handleVoiceRecordingComplete}
            onCancel={handleCancelVoice}
            className="w-full"
          />
        ) : (
          // default input UI (typing)
          <>
            <input
              type="text"
              value={message}
              onChange={(e) => handleChangeMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText();
                }
              }}
              placeholder="Type something to send"
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
            />

            <div className="flex items-center gap-2">
              {/* Emoji hover area */}
              <div
                className="relative"
                onMouseEnter={() => setShowEmojiPicker(true)}
                onMouseLeave={() => setShowEmojiPicker(false)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <Smile className="h-5 w-5 text-muted-foreground" />
                </Button>

                {showEmojiPicker && (
                  <div className="absolute bottom-10 right-0 z-50">
                    <EmojiPicker
                      onEmojiClick={(emoji) => {
                        handleChangeMessage(message + emoji.emoji);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* File attach */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </Button>

              {/* Text send OR mic icon */}
              {message.trim() ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={handleSendText}
                >
                  <Send className="h-5 w-5 text-primary" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={handleMicClick}
                >
                  <Mic className="h-5 w-5 text-muted-foreground" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
