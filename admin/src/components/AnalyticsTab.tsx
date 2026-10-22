'use client';

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';
import { AnalyticsSummary, DepartmentMetrics, ResolutionTrend } from '../lib/api';

interface AnalyticsProps {
  summary: AnalyticsSummary;
  departments: DepartmentMetrics[];
  trends: ResolutionTrend[];
}

const DEPT_COLORS: Record<string, string> = {
  Electrical: '#f59e0b',
  Plumbing: '#3b82f6',
  HVAC: '#8b5cf6',
  Civil: '#22c55e',
  'IT & Network': '#F26522',
};

const STATUS_COLORS = ['#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];

const CustomTooltip = (props: Partial<TooltipContentProps>) => {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-tooltip">
      <p className="analytics-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="analytics-tooltip-value" style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}{entry.name === 'Avg. mins' ? ' min' : ''}</strong>
        </p>
      ))}
    </div>
  );
};

export const AnalyticsTab: React.FC<AnalyticsProps> = ({ summary, departments, trends }) => {
  const pieData = [
    { name: 'Resolved', value: summary.resolvedIssues },
    { name: 'Pending', value: summary.pendingIssues },
    { name: 'Escalated', value: summary.escalatedIssues },
  ];

  return (
    <div className="analytics-layout">
      <div className="analytics-kpis">
        <div className="kpi-card">
          <div className="analytics-kpi-heading">
            <span className="analytics-kpi-label">Avg. resolution time</span>
            <div className="kpi-icon analytics-icon-primary"><Clock size={16} /></div>
          </div>
          <div className="analytics-kpi-value">{summary.avgResolutionTimeMins}<span>min</span></div>
          <div className="analytics-kpi-caption">Based on completed issue records</div>
        </div>

        <div className="kpi-card">
          <div className="analytics-kpi-heading">
            <span className="analytics-kpi-label">SLA compliance</span>
            <div className="kpi-icon analytics-icon-success"><CheckCircle2 size={16} /></div>
          </div>
          <div className="analytics-kpi-value success">{summary.avgSlaCompliance}<span>%</span></div>
          <div className="analytics-kpi-caption">Across all departments</div>
        </div>

        <div className="kpi-card">
          <div className="analytics-kpi-heading">
            <span className="analytics-kpi-label">Rework rate</span>
            <div className="kpi-icon analytics-icon-warning"><TrendingUp size={16} /></div>
          </div>
          <div className="analytics-kpi-value">{summary.avgReworkRate}<span>%</span></div>
          <div className="analytics-kpi-caption">Calculated from recorded rework</div>
        </div>

        <div className="kpi-card">
          <div className="analytics-kpi-heading">
            <span className="analytics-kpi-label">Escalation rate</span>
            <div className="kpi-icon analytics-icon-danger"><AlertTriangle size={16} /></div>
          </div>
          <div className={`analytics-kpi-value${summary.escalatedIssues > 5 ? ' danger' : ''}`}>{summary.escalatedIssues}</div>
          <div className="analytics-kpi-caption">of {summary.totalIssues} total tickets escalated</div>
        </div>
      </div>

      <div className="analytics-chart-grid">
        <div className="card analytics-card">
          <div className="analytics-card-heading">
            <BarChart3 size={16} className="analytics-primary-text" />
            <h3>Weekly resolution trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trends} barSize={12} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tick={{ fontSize: 11, fill: '#9C9A92', fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9C9A92', fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="resolved" name="Resolved" fill="#F26522" radius={[4, 4, 0, 0]} />
              <Bar dataKey="escalated" name="Escalated" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card analytics-card">
          <h3 className="analytics-card-title">Issue status distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={54} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, index) => <Cell key={index} fill={STATUS_COLORS[index]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => <span className="analytics-legend-label">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card analytics-card">
        <h3 className="analytics-card-title">Daily avg. resolution time (minutes)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tick={{ fontSize: 11, fill: '#9C9A92', fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9C9A92', fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="avgMins" name="Avg. mins" stroke="#F26522" strokeWidth={2.5} dot={{ r: 4, fill: '#F26522', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#F26522', stroke: '#fff', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card analytics-card">
        <h3 className="analytics-card-title">Department performance breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={departments} layout="vertical" barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9C9A92', fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="department" tick={{ fontSize: 12, fill: '#6B6A65', fontFamily: 'Manrope', fontWeight: 600 }} axisLine={false} tickLine={false} width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="resolvedIssues" name="Resolved" radius={[0, 4, 4, 0]}>
              {departments.map((department) => <Cell key={department.department} fill={DEPT_COLORS[department.department] || '#F26522'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card analytics-table-card">
        <div className="analytics-table-heading">
          <h3>Department scorecard</h3>
          <span>Last 30 days</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Department</th><th>Total tickets</th><th>Resolved</th><th>Escalated</th><th>Active workers</th><th>SLA compliance</th><th>Rework rate</th></tr>
            </thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department.department}>
                  <td><div className="analytics-department"><span style={{ background: DEPT_COLORS[department.department] || '#F26522' }} /><strong>{department.department}</strong></div></td>
                  <td className="analytics-table-strong">{department.totalIssues}</td>
                  <td><span className="analytics-good">{department.resolvedIssues}</span></td>
                  <td>{department.escalatedIssues > 0 ? <span className="analytics-bad">{department.escalatedIssues}</span> : <span className="analytics-muted">0</span>}</td>
                  <td>{department.activeWorkers} techs</td>
                  <td>
                    <div className="analytics-sla-cell">
                      <div className="analytics-sla-track"><div className="analytics-sla-fill" style={{ width: `${department.slaComplianceRate}%`, background: department.slaComplianceRate >= 90 ? '#22c55e' : department.slaComplianceRate >= 75 ? '#f59e0b' : '#ef4444' }} /></div>
                      <span className={department.slaComplianceRate >= 90 ? 'analytics-good' : 'analytics-warning'}>{department.slaComplianceRate}%</span>
                    </div>
                  </td>
                  <td className={department.reworkRate > 3 ? 'analytics-bad' : 'analytics-good'}>{department.reworkRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
