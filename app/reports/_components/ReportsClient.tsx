"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Loader2,
  Minus,
  UserPlus,
  UserMinus,
  Banknote,
  Trophy,
  Crown,
} from "lucide-react";
import PageTitleWithStar from "@/components/PageTitleWithStar";
import { replaceMoneyKr } from "@/utils/format";

// Server Actions
import ReportsSkeleton from "./ReportsSkeleton";
import { getMonthlyTotalAction, getCustomerStatsAction } from "@/app/_actions";

// --- Types ---
interface ChartDataItem {
  month: string;
  income: number;
  incomeCount: number;
  expenditure: number;
  join: number;
  leave: number;
  totalMembers: number;
}

interface Props {
  academyCode: string;
  initialChartData: ChartDataItem[];
  currentServerYear: number;
  customerList: any[];
}

type TabType = "customer" | "income" | "expenditure";

// --- Constants ---
const COLORS = {
  blue: "#3182f6",
  red: "#ef4444",
  green: "#10b981",
  orange: "#f97316",
  gray: "#94a3b8",
  purple: "#8b5cf6",
  state: ["#3182f6", "#94a3b8", "#fbbf24"],
  gender: ["#60a5fa", "#f472b6"],
  school: ["#c084fc", "#fbbf24", "#60a5fa", "#f87171", "#94a3b8"],
  frequency: ["#2dd4bf", "#818cf8", "#fb7185", "#38bdf8", "#fcd34d"],
  topSpending: ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981"],
};

const DEFAULT_CHART_ITEM: ChartDataItem = {
  month: "",
  income: 0,
  incomeCount: 0,
  expenditure: 0,
  join: 0,
  leave: 0,
  totalMembers: 0,
};

// --- Sub Components ---

const TrendBadge = ({
  rate,
  isReverse = false,
}: {
  rate: number;
  isReverse?: boolean;
}) => {
  if (rate === 0)
    return (
      <Badge $color="gray">
        <Minus size={12} /> 변동 없음
      </Badge>
    );

  const finalColor = isReverse
    ? rate > 0
      ? "red"
      : "green"
    : rate > 0
    ? "green"
    : "red";

  return (
    <Badge $color={finalColor}>
      {rate > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(rate)}% {rate > 0 ? "증가" : "감소"}
    </Badge>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <TooltipWrapper>
        <TooltipLabel>{label}</TooltipLabel>
        {payload.map((entry: any, index: number) => (
          <TooltipItem key={index} color={entry.color}>
            <span>{entry.name}:</span>
            <strong>
              {typeof entry.value === "number"
                ? entry.name.includes("금액") ||
                  entry.name.includes("수입") ||
                  entry.name.includes("지출")
                  ? replaceMoneyKr(entry.value)
                  : `${entry.value}${entry.name.includes("건수") ? "건" : "명"}`
                : entry.value}
            </strong>
          </TooltipItem>
        ))}
      </TooltipWrapper>
    );
  }
  return null;
};

// --- Main Component ---

export default function ReportsClient({
  academyCode,
  initialChartData,
  currentServerYear,
  customerList = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("customer");
  const [currentYear, setCurrentYear] = useState(currentServerYear);
  const [chartData, setChartData] = useState<ChartDataItem[]>(initialChartData);
  const [isLoading, setIsLoading] = useState(false);

  const thisMonthIdx = new Date().getMonth();
  const isFirstRender = useRef(true);

  // 1. Data Fetching
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const yearStr = String(currentYear);
        const [incomeData, expenditureData, customerData] = (await Promise.all([
          getMonthlyTotalAction(yearStr, "income", academyCode),
          getMonthlyTotalAction(yearStr, "expenditure", academyCode),
          getCustomerStatsAction(yearStr, academyCode),
        ])) as [any[], any[], any[]];

        const newChartData = Array.from({ length: 12 }, (_, i) => {
          const monthStr = String(i + 1).padStart(2, "0");
          const incomeItem = incomeData.find((d: any) => d.month === monthStr);
          const expendItem = expenditureData.find(
            (d: any) => d.month === monthStr
          );
          const customerItem = customerData.find(
            (d: any) => d.month === monthStr
          );

          return {
            month: `${i + 1}월`,
            income: incomeItem?.total || 0,
            incomeCount: incomeItem?.count || 0,
            expenditure: expendItem?.total || 0,
            join: customerItem?.join || 0,
            leave: customerItem?.leave || 0,
            totalMembers: customerItem?.total || 0,
          };
        });

        setChartData(newChartData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentYear, academyCode]);

  // 2. Statistics Calculation (useMemo)
  const stats = useMemo(() => {
    const current = chartData[thisMonthIdx] || DEFAULT_CHART_ITEM;
    const prev =
      thisMonthIdx > 0 ? chartData[thisMonthIdx - 1] : DEFAULT_CHART_ITEM;

    const calcRate = (cur: number, pre: number) => {
      if (!pre) return cur > 0 ? 100 : 0;
      return Math.round(((cur - pre) / pre) * 100);
    };

    const totalIncomeYear = chartData.reduce((acc, cur) => acc + cur.income, 0);
    const totalExpenditureYear = chartData.reduce(
      (acc, cur) => acc + cur.expenditure,
      0
    );
    const totalJoinYear = chartData.reduce((acc, cur) => acc + cur.join, 0);
    const totalLeaveYear = chartData.reduce((acc, cur) => acc + cur.leave, 0);

    const maxIncomeItem = chartData.reduce(
      (max, cur) => (cur.income > max.income ? cur : max),
      chartData[0] || DEFAULT_CHART_ITEM
    );
    const maxExpenditureItem = chartData.reduce(
      (max, cur) => (cur.expenditure > max.expenditure ? cur : max),
      chartData[0] || DEFAULT_CHART_ITEM
    );

    return {
      income: {
        total: current.income || 0,
        rate: calcRate(current.income || 0, prev.income || 0),
        count: current.incomeCount || 0,
        totalYear: totalIncomeYear,
        maxAmount: maxIncomeItem.income || 0,
        maxMonth: maxIncomeItem.month || "-",
      },
      expenditure: {
        total: current.expenditure || 0,
        rate: calcRate(current.expenditure || 0, prev.expenditure || 0),
        totalYear: totalExpenditureYear,
        maxAmount: maxExpenditureItem.expenditure || 0,
        maxMonth: maxExpenditureItem.month || "-",
      },
      customer: {
        joinYear: totalJoinYear,
        leaveYear: totalLeaveYear,
        total: current.totalMembers || 0,
      },
    };
  }, [chartData, thisMonthIdx]);

  // 3. Customer Demographics Calculation (useMemo)
  const customerDemographics = useMemo(() => {
    const stateData = { active: 0, pause: 0, wait: 0, rest: 0 };
    const genderData = { male: 0, female: 0 };
    const schoolData = { kinder: 0, elem: 0, middle: 0, high: 0, etc: 0 };
    const freqData: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    const todayYear = new Date().getFullYear();

    customerList.forEach((c: any) => {
      if (c.state === "0") stateData.active++;
      else if (c.state === "1") stateData.rest++;
      else if (c.state === "2") stateData.pause++;
      else if (c.state === "3") stateData.wait++;

      if (c.state === "0") {
        if (c.sex === "M" || c.sex === "남") genderData.male++;
        else if (c.sex === "F" || c.sex === "여") genderData.female++;

        if (c.birth) {
          const birthYear = parseInt(c.birth.substring(0, 4), 10);
          const age = todayYear - birthYear + 1;
          if (age <= 7) schoolData.kinder++;
          else if (age >= 8 && age <= 13) schoolData.elem++;
          else if (age >= 14 && age <= 16) schoolData.middle++;
          else if (age >= 17 && age <= 19) schoolData.high++;
          else schoolData.etc++;
        }

        const count = parseInt(c.count || "0", 10);
        if (count >= 1 && count <= 5) freqData[count]++;
      }
    });

    return {
      state: [
        { name: "재원", value: stateData.active },
        { name: "휴원", value: stateData.rest },
        { name: "대기", value: stateData.wait },
      ].filter((d) => d.value > 0),
      gender: [
        { name: "남자", value: genderData.male },
        { name: "여자", value: genderData.female },
      ].filter((d) => d.value > 0),
      school: [
        { name: "유치부", value: schoolData.kinder },
        { name: "초등부", value: schoolData.elem },
        { name: "중등부", value: schoolData.middle },
        { name: "고등부", value: schoolData.high },
        { name: "성인/기타", value: schoolData.etc },
      ].filter((d) => d.value > 0),
      frequency: [
        { name: "주 1회", value: freqData[1] },
        { name: "주 2회", value: freqData[2] },
        { name: "주 3회", value: freqData[3] },
        { name: "주 4회", value: freqData[4] },
        { name: "주 5회", value: freqData[5] },
      ].filter((d) => d.value > 0),
    };
  }, [customerList]);

  // 4. Top Spending Calculation (useMemo)
  const topSpendingData = useMemo(() => {
    return [...chartData]
      .sort((a, b) => b.expenditure - a.expenditure)
      .slice(0, 5)
      .map((item) => ({ name: item.month, value: item.expenditure }));
  }, [chartData]);

  const handleYearChange = (dir: number) => setCurrentYear((p) => p + dir);

  return (
    <>
      {isLoading ? (
        <ReportsSkeleton />
      ) : (
        <Container>
          <Header>
            <PageTitleWithStar title={<Title>통계</Title>} />
            <Controls>
              <YearSelector>
                <YearButton
                  onClick={() => handleYearChange(-1)}
                  disabled={isLoading}
                >
                  <ChevronLeft size={16} />
                </YearButton>
                <YearDisplay>
                  <CalendarIcon size={14} /> {currentYear}
                </YearDisplay>
                <YearButton
                  onClick={() => handleYearChange(1)}
                  disabled={isLoading}
                >
                  <ChevronRight size={16} />
                </YearButton>
              </YearSelector>
              <TabGroup>
                <TabItem
                  $active={activeTab === "customer"}
                  onClick={() => setActiveTab("customer")}
                >
                  인원
                </TabItem>
                <TabItem
                  $active={activeTab === "income"}
                  onClick={() => setActiveTab("income")}
                >
                  수입
                </TabItem>
                <TabItem
                  $active={activeTab === "expenditure"}
                  onClick={() => setActiveTab("expenditure")}
                >
                  지출
                </TabItem>
              </TabGroup>
            </Controls>
          </Header>

          <ContentFade key={activeTab} $isLoading={isLoading}>
            {isLoading && (
              <LoadingOverlay>
                <Loader2 className="animate-spin" size={40} color="#3182f6" />
              </LoadingOverlay>
            )}

            {/* 1. Customer Tab */}
            {activeTab === "customer" && (
              <DashboardGrid>
                <StatCard>
                  <StatHeader>
                    <StatTitle>{currentYear}년 신규 등록</StatTitle>
                    <IconCircle $bg="#e0f2fe" $color="#0284c7">
                      <UserPlus size={18} />
                    </IconCircle>
                  </StatHeader>
                  <StatValue>{stats.customer.joinYear}명</StatValue>
                  <StatDesc>
                    월 평균 {(stats.customer.joinYear / 12).toFixed(1)}명
                  </StatDesc>
                </StatCard>

                <StatCard>
                  <StatHeader>
                    <StatTitle>{currentYear}년 총 퇴원</StatTitle>
                    <IconCircle $bg="#fee2e2" $color="#ef4444">
                      <UserMinus size={18} />
                    </IconCircle>
                  </StatHeader>
                  <StatValue>{stats.customer.leaveYear}명</StatValue>
                  <StatDesc>
                    월 평균 {(stats.customer.leaveYear / 12).toFixed(1)}명
                  </StatDesc>
                </StatCard>

                <StatCard>
                  <StatHeader>
                    <StatTitle>현재 재원생</StatTitle>
                    <IconCircle $bg="#dcfce7" $color="#16a34a">
                      <Users size={18} />
                    </IconCircle>
                  </StatHeader>
                  <StatValue>
                    {customerDemographics.state.find((s) => s.name === "재원")
                      ?.value || 0}
                    명
                  </StatValue>
                  <StatDesc>실시간 활성 원생</StatDesc>
                </StatCard>

                <MainChartCard>
                  <CardTitle>월별 입원 · 퇴원 추이</CardTitle>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barGap={4}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          width={25}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "#f8fafc" }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                        <Bar
                          dataKey="join"
                          name="입원생"
                          fill={COLORS.blue}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                        <Bar
                          dataKey="leave"
                          name="퇴원생"
                          fill={COLORS.red}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </MainChartCard>

                <SubChartCard>
                  <CardTitle>현재 원생 상태</CardTitle>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerDemographics.state}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {customerDemographics.state.map((e, i) => (
                            <Cell
                              key={i}
                              fill={COLORS.state[i % COLORS.state.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </SubChartCard>

                <PieChartGrid>
                  <PieCard title="성별 분포">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={customerDemographics.gender}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {customerDemographics.gender.map((e, i) => (
                            <Cell
                              key={i}
                              fill={COLORS.gender[i % COLORS.gender.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </PieCard>

                  <PieCard title="학교급 분포">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={customerDemographics.school}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {customerDemographics.school.map((e, i) => (
                            <Cell
                              key={i}
                              fill={COLORS.school[i % COLORS.school.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </PieCard>

                  <PieCard title="수강 횟수 분포">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={customerDemographics.frequency}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {customerDemographics.frequency.map((e, i) => (
                            <Cell
                              key={i}
                              fill={
                                COLORS.frequency[i % COLORS.frequency.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </PieCard>
                </PieChartGrid>
              </DashboardGrid>
            )}

            {/* 2. Income Tab */}
            {activeTab === "income" && (
              <DashboardGrid>
                <StatCard>
                  <StatHeader>
                    <StatTitle>이번 달 수입</StatTitle>
                    <IconCircle $bg="#e0f2fe" $color="#0284c7">
                      <CreditCard size={18} />
                    </IconCircle>
                  </StatHeader>
                  <StatValue>{replaceMoneyKr(stats.income.total)}</StatValue>
                  <StatDesc>
                    지난 달 대비 <TrendBadge rate={stats.income.rate} />
                  </StatDesc>
                </StatCard>

                <StatCard>
                  <StatHeader>
                    <StatTitle>올해 누적 수입</StatTitle>
                    <IconCircle $bg="#f0fdf4" $color="#16a34a">
                      <Banknote size={18} />
                    </IconCircle>
                  </StatHeader>
                  <StatValue>
                    {replaceMoneyKr(stats.income.totalYear)}
                  </StatValue>
                  <StatDesc>연간 총 매출</StatDesc>
                </StatCard>

                <StatCard>
                  <StatHeader>
                    <StatTitle>올해 최고 매출</StatTitle>
                    <IconCircle $bg="#fff7ed" $color="#ea580c">
                      <Trophy size={18} />
                    </IconCircle>
                  </StatHeader>
                  <StatValue>
                    {replaceMoneyKr(stats.income.maxAmount)}
                  </StatValue>
                  <StatDesc>
                    <strong>{stats.income.maxMonth}</strong> 달성
                  </StatDesc>
                </StatCard>

                <MainChartCard>
                  <CardTitle>월별 매출 금액 추이</CardTitle>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => `${val / 10000}만`}
                          width={35}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "#f8fafc" }}
                        />
                        <Bar
                          dataKey="income"
                          name="매출 금액"
                          fill={COLORS.blue}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </MainChartCard>

                <SubChartCard>
                  <CardTitle>월별 매출 건수</CardTitle>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorCount"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={COLORS.purple}
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor={COLORS.purple}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="incomeCount"
                          name="건수"
                          stroke={COLORS.purple}
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorCount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </SubChartCard>
              </DashboardGrid>
            )}

            {/* 3. Expenditure Tab */}
            {activeTab === "expenditure" && (
              <DashboardGrid>
                <StatCard>
                  <StatHeader>
                    <StatTitle>이번 달 지출</StatTitle>
                    <IconCircle $bg="#fee2e2" $color="#ef4444">
                      <Wallet size={18} />
                    </IconCircle>
                  </StatHeader>
                  <StatValue>
                    {replaceMoneyKr(stats.expenditure.total)}
                  </StatValue>
                  <StatDesc>
                    지난 달 대비{" "}
                    <TrendBadge rate={stats.expenditure.rate} isReverse />
                  </StatDesc>
                </StatCard>

                <StatCard>
                  <StatHeader>
                    <StatTitle>올해 누적 지출</StatTitle>
                    <IconCircle $bg="#fff7ed" $color="#ea580c">
                      <Banknote size={18} />
                    </IconCircle>
                  </StatHeader>
                  <StatValue>
                    {replaceMoneyKr(stats.expenditure.totalYear)}
                  </StatValue>
                  <StatDesc>연간 총 지출액</StatDesc>
                </StatCard>

                <StatCard>
                  <StatHeader>
                    <StatTitle>올해 최고 지출</StatTitle>
                    <IconCircle $bg="#f1f5f9" $color="#64748b">
                      <Crown size={18} />
                    </IconCircle>
                  </StatHeader>
                  <StatValue>
                    {replaceMoneyKr(stats.expenditure.maxAmount)}
                  </StatValue>
                  <StatDesc>
                    <strong>{stats.expenditure.maxMonth}</strong> 기록
                  </StatDesc>
                </StatCard>

                <MainChartCard>
                  <CardTitle>월별 지출 추이</CardTitle>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => `${val / 10000}만`}
                          width={35}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="expenditure"
                          name="지출금액"
                          stroke={COLORS.red}
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            fill: COLORS.red,
                            strokeWidth: 2,
                            stroke: "#fff",
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </MainChartCard>

                <SubChartCard>
                  <CardTitle>지출 상위 월 (TOP 5)</CardTitle>
                  <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topSpendingData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#f0f0f0"
                        />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 12, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          cursor={{ fill: "#f8fafc" }}
                          content={<CustomTooltip />}
                        />
                        <Bar
                          dataKey="value"
                          name="지출"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        >
                          {topSpendingData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                COLORS.topSpending[
                                  index % COLORS.topSpending.length
                                ]
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartWrapper>
                </SubChartCard>
              </DashboardGrid>
            )}
          </ContentFade>
        </Container>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// ✨ Styled Components (기존과 동일)
// --------------------------------------------------------------------------
const Container = styled.div`
  padding: 24px;
  background-color: white;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(224, 224, 224, 0.4);
  border-radius: 24px;
  @media (max-width: 768px) {
    padding: 16px;
    margin-bottom: 60px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
  gap: 16px;

  @media (min-width: 769px) {
    flex-direction: row;
    align-items: center;
    margin-bottom: 8px;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 800;
  color: #191f28;
  margin: 0;

  @media (min-width: 769px) {
    font-size: 26px;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  @media (min-width: 769px) {
    width: auto;
    gap: 16px;
  }
`;
const YearSelector = styled.div`
  display: flex;
  align-items: center;
  background: #f3f4f6; /* ✅ 연한 회색으로 변경 */
  border-radius: 12px;
  padding: 0 4px;
  /* 배경이 회색이므로 그림자는 살짝 줄이거나 유지해도 됩니다 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: 40px;
  flex-shrink: 0;

  @media (min-width: 769px) {
    height: 48px;
    padding: 0 8px;
    border-radius: 14px;
  }
`;
const YearButton = styled.button`
  width: 32px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s;

  &:hover:not(:disabled) {
    color: #3182f6;
    background-color: #f8f9fa;
    border-radius: 8px;
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (min-width: 769px) {
    width: 40px;

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const YearDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  padding: 0 4px;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
  }

  @media (min-width: 769px) {
    font-size: 18px;
    gap: 8px;
    padding: 0 8px;
  }
`;

const TabGroup = styled.div`
  display: flex;
  background: #e2e8f0;
  padding: 4px;
  border-radius: 12px;
  flex: 1;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 769px) {
    flex: initial;
    padding: 5px;
    border-radius: 14px;
  }
`;

const TabItem = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  ${(props) =>
    props.$active
      ? css`
          background: white;
          color: #3182f6;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        `
      : css`
          background: transparent;
          color: #64748b;
          &:hover {
            color: #333;
          }
        `}

  @media (min-width: 769px) {
    padding: 10px 24px;
    font-size: 15px;
    border-radius: 10px;
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const CardBase = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(224, 224, 224, 0.3);
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StatCard = styled(CardBase)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  min-height: auto;
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const StatTitle = styled.h3`
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  margin: 0;
`;

const IconCircle = styled.div<{ $bg: string; $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background-color: ${(props) => props.$bg};
  color: ${(props) => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.5px;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const StatDesc = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94a3b8;
`;

const Badge = styled.span<{ $color: "green" | "red" | "blue" | "gray" }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  ${(props) => {
    switch (props.$color) {
      case "green":
        return `background: #dcfce7; color: #16a34a;`;
      case "red":
        return `background: #fee2e2; color: #ef4444;`;
      case "blue":
        return `background: #dbeafe; color: #2563eb;`;
      default:
        return `background: #f1f5f9; color: #64748b;`;
    }
  }}
`;

const MainChartCard = styled(CardBase)`
  grid-column: span 2;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  @media (max-width: 1024px) {
    grid-column: span 3;
  }
  @media (max-width: 768px) {
    min-height: 280px;
    width: 100%;
  }
`;

const SubChartCard = styled(CardBase)`
  min-height: 320px;
  display: flex;
  flex-direction: column;
  @media (max-width: 768px) {
    min-height: 280px;
    width: 100%;
  }
`;

const CardTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #333;
  margin: 0 0 16px 0;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 250px;
  position: relative;
`;

const PieChartGrid = styled.div`
  grid-column: span 3;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const PieCardComponent = styled(CardBase)`
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const PieCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <PieCardComponent>
    <CardTitle style={{ alignSelf: "flex-start" }}>{title}</CardTitle>
    {children}
  </PieCardComponent>
);

const TooltipWrapper = styled.div`
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 8px 12px;
`;

const TooltipLabel = styled.p`
  margin: 0 0 6px 0;
  font-size: 12px;
  font-weight: 700;
  color: #333;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 4px;
`;

const TooltipItem = styled.div<{ color: string }>`
  font-size: 12px;
  color: #475569;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  strong {
    color: ${(props) => props.color};
  }
`;

const ContentFade = styled.div<{ $isLoading: boolean }>`
  position: relative;
  transition: opacity 0.3s;
  opacity: ${(props) => (props.$isLoading ? 0.6 : 1)};
  animation: fadeIn 0.4s ease-out;
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
