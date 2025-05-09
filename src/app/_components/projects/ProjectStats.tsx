"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, CheckCircle2 } from "lucide-react";

interface ProjectStatsProps {
  projectId: string;
}

export function ProjectStats({ projectId }: ProjectStatsProps) {
  const { data: stats, isLoading } = api.project.getProjectStats.useQuery(
    { projectId },
    { refetchInterval: 30000 }, // Refresh every 30 seconds
  );

  if (isLoading) {
    return <StatsCardsSkeleton />;
  }

  if (!stats) {
    return null;
  }

  // Prepare data for winner distribution chart
  const winnerData = [
    { name: "Output A", value: stats.winnerDistribution.A },
    { name: "Output B", value: stats.winnerDistribution.B },
    { name: "Ties", value: stats.winnerDistribution.tie },
  ];

  // Custom colors for the chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Interview Stats */}
      <Card>
        <CardContent className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Interview Stats
            </span>
          </div>

          <div className="grid grid-cols-2 gap-y-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {stats.totalSessionsCount}
                </span>
                <span className="text-xs text-gray-500">Total</span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-2xl font-semibold">
                  {Math.round(stats.completionRate)}%
                </span>
                <span className="text-xs text-gray-500">Rate</span>
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {stats.completedSessionsCount}
                </span>
                <span className="text-xs text-gray-500">Completed</span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-2xl font-semibold">
                  {stats.totalQuestionsEvaluated}
                </span>
                <span className="text-xs text-gray-500">Questions</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Comparison */}
      <Card>
        <CardContent className="px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">
                Output Comparison
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Avg. Severity:{" "}
              <span className="font-medium">
                {stats.averageSeverityScore.toFixed(1)}
              </span>
            </div>
          </div>

          {stats.winnerDistribution.A > 0 ||
          stats.winnerDistribution.B > 0 ||
          stats.winnerDistribution.tie > 0 ? (
            <div className="space-y-3">
              {/* Output A */}
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-600">Output A</span>
                  <span className="font-medium">
                    {stats.winnerDistribution.A}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${calculatePercentage(stats.winnerDistribution.A, stats)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Output B */}
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-600">Output B</span>
                  <span className="font-medium">
                    {stats.winnerDistribution.B}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${calculatePercentage(stats.winnerDistribution.B, stats)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Ties */}
              {stats.winnerDistribution.tie > 0 && (
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-gray-600">Ties</span>
                    <span className="font-medium">
                      {stats.winnerDistribution.tie}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{
                        width: `${calculatePercentage(stats.winnerDistribution.tie, stats)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[80px] items-center justify-center text-sm text-gray-400">
              No comparison data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate percentage for bar width
function calculatePercentage(
  value: number,
  stats: { winnerDistribution: { A: number; B: number; tie: number } },
): number {
  const total =
    stats.winnerDistribution.A +
    stats.winnerDistribution.B +
    stats.winnerDistribution.tie;
  if (total === 0) return 0;
  return (value / total) * 100;
}

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div>
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
