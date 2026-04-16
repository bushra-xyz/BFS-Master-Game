import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameControlsProps {
  onMove: (dir: "up" | "down" | "left" | "right") => void;
  disabled: boolean;
}

export default function GameControls({ onMove, disabled }: GameControlsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
      <div />
      <Button
        variant="outline"
        size="icon"
        onClick={() => onMove("up")}
        disabled={disabled}
        className="border-primary/40 hover:bg-primary/20 hover:border-primary"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
      <div />
      <Button
        variant="outline"
        size="icon"
        onClick={() => onMove("left")}
        disabled={disabled}
        className="border-primary/40 hover:bg-primary/20 hover:border-primary"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onMove("down")}
        disabled={disabled}
        className="border-primary/40 hover:bg-primary/20 hover:border-primary"
      >
        <ArrowDown className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onMove("right")}
        disabled={disabled}
        className="border-primary/40 hover:bg-primary/20 hover:border-primary"
      >
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
