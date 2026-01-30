import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, isProcessing = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        onRecordingComplete(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className="w-20 h-20 rounded-full"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            data-testid="button-record"
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : isRecording ? (
              <Square className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
          {isRecording && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive"></span>
            </span>
          )}
        </div>

        <div className="text-center">
          {isRecording ? (
            <>
              <p className="text-lg font-medium text-destructive" data-testid="text-recording-time">
                Recording... {formatTime(recordingTime)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Describe your recipe - ingredients, steps, tips
              </p>
            </>
          ) : isProcessing ? (
            <>
              <p className="text-lg font-medium" data-testid="text-processing">
                Processing your recipe...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                AI is creating your structured recipe
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">Tap to Record</p>
              <p className="text-sm text-muted-foreground mt-1">
                Describe your recipe verbally and we'll create it for you
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
