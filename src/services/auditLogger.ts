/**
 * Audit Logger Service
 * Persists audit logs to localStorage to ensure history is maintained 
 * across page refreshes.
 */

export interface AuditLog {
  id: string;
  transactionId: string;
  action: string;
  newState: any;
  timestamp: string;
  actor: string;
}

const STORAGE_KEY = 'vortex_audit_logs';

export const auditLogger = {
  /**
   * Persists a new log entry to localStorage.
   */
  saveLog: (log: AuditLog): void => {
    try {
      const existingLogs = auditLogger.getLogs();
      const updatedLogs = [log, ...existingLogs];
      // Keep only last 1000 logs to prevent storage bloating
      const trimmedLogs = updatedLogs.slice(0, 1000);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Failed to persist audit log:', error);
    }
  },

  /**
   * Retrieves all persisted audit logs.
   */
  getLogs: (): AuditLog[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  },

  /**
   * Clears all persisted audit logs.
   */
  clearLogs: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
