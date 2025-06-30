import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <div className="w-full">
        <ChartAreaInteractive />
      </div>
      <div className="flex gap-4 w-full">
        <ChartRadarGridCircle />
        <ChartRadarGridCircle />
      </div>
    </div>
  );
}
