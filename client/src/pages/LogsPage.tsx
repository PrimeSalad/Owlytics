import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PageWrapper } from '@/components/layout';
import { Card, CardBody, Spinner } from '@/components/ui';
import { Activity, Search } from 'lucide-react';

interface SystemLog {
  id: string;
  action_type: string;
  resource: string;
  details: string;
  created_at: string;
  actor: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const actorName = log.actor ? `${log.actor.first_name} ${log.actor.last_name}`.toLowerCase() : 'system';
    const details = log.details || '';
    return (
      details.toLowerCase().includes(term) ||
      log.action_type.toLowerCase().includes(term) ||
      log.resource.toLowerCase().includes(term) ||
      actorName.includes(term)
    );
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-success-50 text-success-700 border-success-200';
      case 'UPDATE': return 'bg-warning-50 text-warning-700 border-warning-200';
      case 'DELETE': return 'bg-danger-50 text-danger-700 border-danger-200';
      case 'AUTH': return 'bg-brand-50 text-brand-700 border-brand-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <PageWrapper
      title="System Logs"
    >
      <div className="text-sm text-slate-500 mb-6">
        Comprehensive audit trail of system activities
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by actor, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-lg border border-surface-border bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center p-12">
                <Spinner className="h-8 w-8 text-brand-500" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No logs found matching your criteria.
              </div>
            ) : (
              <table className="w-full text-left text-sm min-w-[820px]">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-muted/70 text-left">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Actor</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Resource</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-surface-muted/40">
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {log.actor ? (
                          <div>
                            <div className="font-semibold text-slate-800">{log.actor.first_name} {log.actor.last_name}</div>
                            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{log.actor.role}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getActionColor(log.action_type)}`}>
                          {log.action_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="rounded border border-surface-border bg-surface-muted px-2 py-1 font-mono text-xs text-slate-600">
                          {log.resource}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardBody>
      </Card>
    </PageWrapper>
  );
}
