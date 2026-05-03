import { Position, BfsStep } from "@/lib/maze";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, StepForward, X } from "lucide-react";

interface QueueVisualizerProps {
  steps: BfsStep[];
  currentStep: number;
  isPlaying: boolean;
  speedMs: number;
  onPlayPause: () => void;
  onStep: () => void;
  onSpeedChange: (ms: number) => void;
  onClose: () => void;
}

const SPEED_OPTIONS = [
  { label: "Slow", ms: 200 },
  { label: "Medium", ms: 80 },
  { label: "Fast", ms: 25 },
];

export default function QueueVisualizer({
  steps,
  currentStep,
  isPlaying,
  speedMs,
  onPlayPause,
  onStep,
  onSpeedChange,
  onClose,
}: QueueVisualizerProps) {
  const step = steps[currentStep];
  const total = steps.length;

  if (!step) return null;

  const fmt = (p: Position) => `(${p.row},${p.col})`;

  const explanation =
    step.found && step.added.length === 0
      ? `Dequeued ${fmt(step.dequeued)} — target reached! 🎯`
      : step.added.length > 0
      ? `Dequeued ${fmt(step.dequeued)}. Added ${step.added.map(fmt).join(", ")} to queue.`
      : `Dequeued ${fmt(step.dequeued)}. No new neighbors to add.`;

  return (
    <Card className="w-full lg:w-80 p-4 space-y-3 bg-card border-border">
      <div className="flex items-center justify-between">
        <div className="font-display text-xs tracking-wider text-accent">
          ⟦ BFS QUEUE ⟧
        </div>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/40 rounded px-2 py-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Step</div>
          <div className="font-bold text-foreground">{currentStep + 1} / {total}</div>
        </div>
        <div className="bg-muted/40 rounded px-2 py-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Queue size</div>
          <div className="font-bold text-foreground">{step.queueAfter.length}</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          Dequeued
        </div>
        <div className="inline-block px-3 py-1.5 rounded-md bg-maze-shortest/20 border border-maze-shortest/60 text-maze-shortest font-mono font-bold text-sm">
          {fmt(step.dequeued)}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          Queue (front → back)
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 min-h-[34px]">
          {step.queueAfter.length === 0 && (
            <span className="text-xs text-muted-foreground italic">empty</span>
          )}
          {step.queueAfter.map((p, i) => {
            const isNew = step.added.some((a) => a.row === p.row && a.col === p.col);
            return (
              <div
                key={`${p.row}-${p.col}-${i}`}
                className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-mono border animate-fade-in ${
                  isNew
                    ? "bg-maze-visited/30 border-maze-visited text-maze-visited"
                    : "bg-muted/60 border-border text-foreground"
                }`}
              >
                {fmt(p)}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-muted-foreground leading-relaxed min-h-[2.5rem]">
        {explanation}
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button size="sm" variant="outline" onClick={onPlayPause} className="flex-1">
          {isPlaying ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button size="sm" variant="outline" onClick={onStep} disabled={isPlaying || currentStep >= total - 1}>
          <StepForward className="h-3 w-3 mr-1" />
          Step
        </Button>
      </div>

      <div className="flex gap-1">
        {SPEED_OPTIONS.map((opt) => (
          <Button
            key={opt.label}
            size="sm"
            variant={speedMs === opt.ms ? "default" : "outline"}
            className="flex-1 h-7 text-[10px]"
            onClick={() => onSpeedChange(opt.ms)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
