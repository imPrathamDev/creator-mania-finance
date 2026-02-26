"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";

import data from "../data.json";
import { useCallback, useEffect, useState } from "react";
import { DashboardAnalytics, getDashboardAnalytics } from "@/lib/analytics";
import Header from "@/components/custom/dashboard/Header";

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(
    null,
  );
  const fetchDashboardAnalytics = useCallback(async () => {
    const data = await getDashboardAnalytics("this_month");
    setDashboardData(data);
    console.log(data);
  }, []);

  useEffect(() => {
    fetchDashboardAnalytics();
  }, [fetchDashboardAnalytics]);
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <Header />
        <SectionCards
          comparison={dashboardData === null ? null : dashboardData.comparison}
        />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive
            timeSeries={dashboardData ? dashboardData.timeSeries : null}
          />
        </div>
        <DataTable data={data} />
      </div>
    </div>
  );
}
