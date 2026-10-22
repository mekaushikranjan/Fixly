import { MobileIssue } from './api';
import { ReportItem } from '../types';

function formatDate(date: string): string {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? date : value.toLocaleString();
}

export function toReportItem(issue: MobileIssue): ReportItem {
  const name = issue.assignedWorkerName;
  return {
    id: issue.id,
    ticketId: issue.ticketId,
    title: issue.title,
    building: issue.building,
    floor: issue.floor,
    room: issue.room,
    category: issue.category,
    status: issue.status === 'escalated' ? 'escalated' : issue.status,
    priority: issue.priority,
    description: issue.description,
    reportedAt: formatDate(issue.reportedAt),
    resolvedAt: issue.resolvedAt ? formatDate(issue.resolvedAt) : undefined,
    worker: name
      ? { name, initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() }
      : null,
    beforeImage: issue.photoUrl || null,
    afterImage: issue.resolutionPhoto || null,
    feedback: issue.feedback
      ? { ...issue.feedback, tags: [] }
      : null,
  };
}
