export interface AuditDateSummary {
  date: string;
  displayDate: string;
  eventCount: number;
}

export interface AuditLog {
  id: string;
  problemId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  eventType: string;
  delta: string;
  timestamp: string;
}

