import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Clock, User, Globe } from 'lucide-react';
import { auditLogApi } from '../../services/api';
import { SearchInput } from '../../components/common/SearchInput';
import { formatDate } from '../../utils/formatters';

export const AuditLogList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditLogApi.getAll({ search, action: actionFilter });
      if (res.data.success) {
        setLogs(res.data.auditLogs || res.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchLogs, 300);
    return () => clearTimeout(timer);
  }, [search, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Audit & Security Logs</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable audit trail of all staff logins, patient modifications, medical records, and billing operations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by Action, Module, User..."
          className="w-full md:w-80"
        />

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
        >
          <option value="">All Security Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="REGISTER">REGISTER</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="DISPENSE">DISPENSE</option>
          <option value="DISCHARGE">DISCHARGE</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <p className="mt-2 text-xs text-slate-400">Loading immutable audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">No security audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Details / Description</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{log.module || log.resource || 'System'}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userName || 'System / Anonymous'}
                      </div>
                      <div className="text-[10px] text-slate-400">{log.user?.role || log.userRole}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">{log.details}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(log.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
