"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from "recharts";

interface Props {
  data: any;
  months: string[];
  year: number;
  genderFilter: string;
  classesFilter: number[];
  studentIdsFilter: any[];
}

export default function AttendanceAnalyticsChart({ data, months, year, genderFilter, classesFilter, studentIdsFilter }: Props) {
  if (!data) return null;

  const isStudentView = data.type === 'students';
  const chartData = [];
  
  if (isStudentView) {
    // Student View
    data.students.forEach((s: any) => {
      chartData.push({
        name: s.name.split(' (')[0], // Remove admission number from chart axis for space
        pct: s.attendancePct,
        // Color based on gender if available, otherwise default
        barColor: s.gender === 'M' ? '#3b82f6' : s.gender === 'F' ? '#ec4899' : '#8b5cf6',
        tooltipName: s.name,
      });
    });
  } else {
    // Classes View
    const hasSpecificClasses = classesFilter.length > 0;
    if (!hasSpecificClasses) {
      if (data.overall && data.overall.total > 0) {
        chartData.push({ 
          name: "All School", 
          pct: data.overall.pct, 
          malePct: data.overall.malePct, 
          femalePct: data.overall.femalePct, 
          barColor: "#14532d" 
        });
      }
      if (data.primary && data.primary.total > 0) {
        chartData.push({ 
          name: "Primary", 
          pct: data.primary.pct, 
          malePct: data.primary.malePct, 
          femalePct: data.primary.femalePct, 
          barColor: "#15803d" 
        });
      }
    }
    data.classes.forEach((c: any) => {
      if (c.total > 0) {
        chartData.push({ 
          name: c.className, 
          pct: c.attendancePct, 
          malePct: c.malePct, 
          femalePct: c.femalePct, 
          barColor: "#3b82f6" 
        });
      }
    });
  }

  // Find max and min for the text summary
  let maxEntity = { name: "", pct: 0 };
  let minEntity = { name: "", pct: 100 };
  
  const iterableData = isStudentView ? data.students : data.classes;
  const nameKey = isStudentView ? 'name' : 'className';
  
  iterableData.forEach((item: any) => {
    if (item.total > 0) {
      if (item.attendancePct > maxEntity.pct) {
        maxEntity = { name: item[nameKey], pct: item.attendancePct };
      }
      if (item.attendancePct < minEntity.pct && item.attendancePct > 0) {
        minEntity = { name: item[nameKey], pct: item.attendancePct };
      }
    }
  });

  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (!value || value === 0) return null;
    return (
      <text x={x + width / 2} y={y + 15} fill="#fff" textAnchor="middle" dy={-6} fontSize="10" fontWeight="bold">
        {value}%
      </text>
    );
  };

  const isStacked = !isStudentView && genderFilter === "ALL";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const displayLabel = payload[0].payload.tooltipName || label;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl text-sm">
          <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{displayLabel}</p>
          {isStacked ? (
            <div className="space-y-1">
              <p className="flex justify-between gap-4 font-medium"><span className="text-blue-600">Male:</span> <span>{payload.find((p:any) => p.dataKey === 'malePct')?.value || 0}%</span></p>
              <p className="flex justify-between gap-4 font-medium"><span className="text-pink-500">Female:</span> <span>{payload.find((p:any) => p.dataKey === 'femalePct')?.value || 0}%</span></p>
              <div className="h-px bg-slate-100 my-1"></div>
              <p className="flex justify-between gap-4 font-bold text-slate-900"><span>Overall:</span> <span>{(payload.find((p:any) => p.dataKey === 'malePct')?.value || 0) + (payload.find((p:any) => p.dataKey === 'femalePct')?.value || 0)}%</span></p>
            </div>
          ) : (
            <p className="font-medium text-slate-700">Attendance: <span className="font-bold">{payload[0].value}%</span></p>
          )}
        </div>
      );
    }
    return null;
  };

  const titleMonths = months.length > 2 ? `${months.length} Months` : months.join(" & ");

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Side: Chart */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-slate-800 text-center mb-6 font-outfit uppercase">
            Students Attendance {titleMonths.toUpperCase()} {year}
          </h2>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: isStudentView ? 80 : 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} 
                  angle={-90}
                  textAnchor="end"
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} 
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(val) => `${val}%`}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                {isStacked && <Legend verticalAlign="top" align="center" height={40} iconType="square" wrapperStyle={{ paddingBottom: '20px' }} />}
                
                {isStacked ? (
                  <>
                    <Bar dataKey="malePct" name="Male" stackId="a" fill="#3b82f6" maxBarSize={isStudentView ? 30 : 40}>
                       {/* LabelList left out for cleaner look */}
                    </Bar>
                    <Bar dataKey="femalePct" name="Female" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={isStudentView ? 30 : 40}>
                      <LabelList dataKey="pct" position="top" fill="#475569" fontSize="10" fontWeight="bold" formatter={(val: number) => `${val}%`} />
                    </Bar>
                  </>
                ) : (
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]} maxBarSize={isStudentView ? 30 : 40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.barColor} />
                    ))}
                    <LabelList content={renderCustomLabel} />
                  </Bar>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Text Summary */}
        <div className="w-full xl:w-[350px] flex flex-col gap-6">
          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
            <h3 className="text-sm font-black text-indigo-900 mb-2 uppercase tracking-wide">
              {isStudentView ? 'Student Overview' : 'Monthly Overview'}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {isStudentView ? (
                <>You are currently tracking individual student attendance for <span className="font-bold text-slate-900">{titleMonths} {year}</span>. The chart breaks down the exact attendance percentage for each selected student.</>
              ) : (
                <>In the period of {titleMonths}, the overall attendance {data.overall ? `of the school was ` : `was `}
                <span className="font-bold text-emerald-700">{data.overall?.pct || maxEntity.pct}%</span>. 
                {data.primary?.total > 0 && ` The average attendance of the Primary section was `}
                {data.primary?.total > 0 && <span className="font-bold text-emerald-700">{data.primary.pct}%</span>}
                {data.primary?.total > 0 && '.'}</>
              )}
            </p>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 mb-2 uppercase tracking-wide">
              {isStudentView ? 'Student Performance' : 'Class Performance'}
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {maxEntity.name ? (
                <>
                  Attendance {isStudentView ? 'among these students' : 'across classes'} ranged between <span className="font-bold text-slate-900">{minEntity.pct}% to {maxEntity.pct}%</span>. 
                  {` ${maxEntity.name.split(' (')[0]} had the highest attendance at `}
                  <span className="font-bold text-emerald-700">{maxEntity.pct}%</span>
                  {minEntity.name !== maxEntity.name && `, while ${minEntity.name.split(' (')[0]} was the lowest at `}
                  {minEntity.name !== maxEntity.name && <span className="font-bold text-rose-600">{minEntity.pct}%</span>}.
                </>
              ) : (
                "Not enough data to determine highest and lowest performing groups."
              )}
            </p>
          </div>
          
          <div className="mt-auto p-4 bg-yellow-50 rounded-2xl border border-yellow-200 shadow-sm">
            <p className="text-xs font-bold text-yellow-800 text-center uppercase tracking-wider">
              System Auto-Generated Report
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
