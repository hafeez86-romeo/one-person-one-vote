import React, { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditTrailProps {
  logs: AuditLog[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs, onRefresh, isLoading }) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'success' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(log => {
    if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(q))
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Severity', 'Message', 'Details'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.severity}"`,
      `"${l.message.replace(/"/g, '""')}"`,
      `"${l.details ? JSON.stringify(l.details).replace(/"/g, '""') : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `opov_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `opov_audit_trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Immutable Security Ledger</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Tamper-Evident Audit Trail
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Every verification event, ballot commitment, and duplicate vote rejection is appended to the audit log.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search audit events by action, voter ID, receipt hash..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
          {(['all', 'critical', 'success', 'warning', 'info'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                filterSeverity === sev
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev === 'all' ? `All (${logs.length})` : sev}
            </button>
          ))}
        </div>
      </div>

      {/* AUDIT LOGS STREAM */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/80 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit records found matching your filters.
          </div>
        ) : (
          filteredLogs.map(log => {
            const isCritical = log.severity === 'critical';
            return (
              <div
                key={log.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors ${
                  isCritical ? 'bg-rose-950/20' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getSeverityIcon(log.severity)}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-white">
                        {log.action}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span
                        className={`text-[11px] font-semibold uppercase ${
                          log.severity === 'critical'
                            ? 'text-rose-400'
                            : log.severity === 'success'
                            ? 'text-emerald-400'
                            : log.severity === 'warning'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {log.message}
                    </p>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="bg-slate-950/70 p-2 rounded border border-slate-800/60 font-mono text-[11px] text-slate-400 overflow-x-auto">
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="font-mono text-xs text-slate-400 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
