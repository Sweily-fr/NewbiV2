import { ChartAreaInteractive } from "@/src/components/chart-area-interactive";
import { ChartRadarGridCircle } from "@/src/components/chart-radar-grid-circle";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <h1 className="text-2xl font-semibold pl-6 mb-6">Dashboard</h1>
      <div className="w-full pl-6">
        <ChartAreaInteractive />
      </div>
      <div className="flex gap-4 w-full pl-6">
        <ChartRadarGridCircle />
        <ChartRadarGridCircle />
      </div>
    </div>
  );
}
