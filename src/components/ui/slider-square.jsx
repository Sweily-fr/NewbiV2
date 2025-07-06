import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";

export default function SliderSquare() {
  return (
    <div className="*:not-first:mt-4">
      <Label>Slider with square thumb</Label>
      <Slider
        defaultValue={[25]}
        max={100}
        step={10}
        className="[&>:last-child>span]:rounded"
        aria-label="Slider with square thumb"
      />
    </div>
  );
}
