"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";

import data from "../data.json";
import { useCallback, useEffect, useState } from "react";
import {
  DashboardAnalytics,
  getDashboardAnalytics,
  Period,
} from "@/lib/analytics";
import Header from "@/components/custom/dashboard/Header";
import {
  ChartBarStacked,
  MethodsChartPie,
  TagsChartPie,
} from "@/components/custom/dashboard/pie-and-bar-charts";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarClock, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { DashboardTopCards } from "@/components/custom/dashboard/Dashboardtopcards";
import { useRouter } from "next/navigation";
import { TransactionsTable } from "@/components/custom/tabsles/TransactionsTable";

const periodOptions = [
  "today",
  "this_week",
  "this_month",
  "this_quarter",
  "this_year",
  "last_week",
  "last_month",
  "last_quarter",
  "last_year",
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "last_12_months",
  "custom",
];

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(
    null,
  );
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("this_month");
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 20),
    to: addDays(new Date(new Date().getFullYear(), 0, 20), 20),
  });
  const fetchDashboardAnalytics = useCallback(async () => {
    const data = await getDashboardAnalytics(
      selectedPeriod,
      selectedPeriod === "custom" && date && date.from && date.to
        ? {
            from: date.from.toISOString().split("T")[0],
            to: date.to.toISOString().split("T")[0],
          }
        : undefined,
    );
    setDashboardData(data);
    console.log(data);
  }, [selectedPeriod, date]);
  const router = useRouter();
  useEffect(() => {
    fetchDashboardAnalytics();
  }, [fetchDashboardAnalytics]);
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <Header />
        <div className="flex items-center gap-2 justify-between px-4 lg:px-6">
          <h4 className="font-medium text-2xl">Analytical Report</h4>

          <div className="flex items-center gap-2">
            <Select
              defaultValue={selectedPeriod}
              onValueChange={(value) => setSelectedPeriod(value as Period)}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent position={"item-aligned"}>
                <SelectGroup>
                  {periodOptions.map((period) => (
                    <SelectItem
                      key={period}
                      value={period}
                      className="capitalize"
                    >
                      {period.split("_").join(" ")}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedPeriod === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date-picker-range"
                    className="justify-start px-2.5 font-normal"
                  >
                    <CalendarIcon />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    required={false}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        <SectionCards
          comparison={dashboardData === null ? null : dashboardData.comparison}
          period={selectedPeriod}
          date={date && date.from && date.to ? (date as any) : undefined}
        />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive
            timeSeries={dashboardData ? dashboardData.timeSeries : null}
          />
        </div>
        <div className="px-4 lg:px-6 grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <ChartBarStacked
              dayOfWeek={dashboardData ? dashboardData.dayOfWeek : null}
            />
          </div>
          <MethodsChartPie
            methods={dashboardData ? dashboardData["methodStats"] : null}
          />
          <TagsChartPie
            tags={dashboardData ? dashboardData["tagBreakdown"] : null}
          />
        </div>
        <div className="px-4 lg:px-6">
          <DashboardTopCards
            contacts={dashboardData?.topContacts ?? []}
            topExpense={dashboardData?.topExpense ?? []}
            topIncome={dashboardData?.topIncome ?? []}
            loading={dashboardData === null}
            onViewContacts={() => router.push("/contacts")}
            onViewTransactions={() => router.push("/transactions")}
          />
        </div>
        <div className="px-4 lg:px-6 grid gap-2">
          <h3 className="text-2xl font-medium">Transactions</h3>
          <TransactionsTable />
        </div>
      </div>
    </div>
  );
}
