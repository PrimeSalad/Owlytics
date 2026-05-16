import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { PageWrapper } from '@/components/layout';
import { Card, CardBody, Spinner } from '@/components/ui';
import { Activity, Search, ShieldCheck, Database, Key, ExternalLink } from 'lucide-react';

interface SystemLog {
  id: string;
  action_type: string;
  resource: string;
  details: string;
  target_id: string | null;
  created_at: string;
  actor: {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: any;
}) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardBody>
    </Card>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const navigate = useNavigate();

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
    
    const matchesSearch = 
      details.toLowerCase().includes(term) ||
      log.resource.toLowerCase().includes(term) ||
      actorName.includes(term);
      
    const matchesAction = actionFilter ? log.action_type === actionFilter : true;
    
    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'AUTH': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'SYSTEM': return 'bg-slate-100 text-slate-700 border-slate-300';
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
  
  const handleView = (log: SystemLog) => {
    if (!log.target_id) return;
    
    switch (log.resource) {
      case 'TASK':
        navigate(`/tasks?taskId=${log.target_id}`); // Assuming tasks page can handle ?taskId=
        break;
      case 'USER':
        navigate(`/people`); // Or /students depending on context
        break;
      case 'EVENT':
        navigate(`/events`); // Assuming /events handles context
        break;
      case 'ATTENDANCE':
        navigate(`/attendance`);
        break;
      default:
        // Do nothing if resource is unmapped
        break;
    }
  };

  const authLogsCount = logs.filter(l => l.action_type === 'AUTH').length;
  const sysLogsCount = logs.filter(l => l.action_type !== 'AUTH').length;

  return (
    <PageWrapper
      title="System Logs"
      description="Comprehensive audit trail of system activities and access records."
    >
      <div className="space-y-5">
        
        {/* Metrics */}
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Total Audit Logs" value={logs.length} icon={Database} />
          <MetricCard label="Authentication Events" value={authLogsCount} icon={Key} />
          <MetricCard label="System Modifications" value={sysLogsCount} icon={ShieldCheck} />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-3xl">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs by actor, resource, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-lg border border-surface-border bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-10 rounded-lg border border-surface-border bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Actions</option>
              <option value="AUTH">Authentication</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="SYSTEM">System Event</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : filteredLogs.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
                  <Activity className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No logs found</p>
                <p className="mt-1 text-xs text-slate-400">There are no system activities matching your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-muted/70 text-left">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Actor</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Action Type</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Resource</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Event Details</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-surface-muted/40">
                        <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200">
                              {log.actor ? `${log.actor.first_name[0]}${log.actor.last_name[0]}` : 'SY'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">
                                {log.actor ? `${log.actor.first_name} ${log.actor.last_name}` : 'System Agent'}
                              </p>
                              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {log.actor ? log.actor.role : 'Automated Process'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getActionColor(log.action_type)}`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="rounded border border-surface-border bg-surface-muted px-2 py-1 font-mono text-xs font-medium text-slate-600">
                            {log.resource}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {log.details || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {log.target_id && log.action_type !== 'DELETE' && (
                            <button
                              onClick={() => handleView(log)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-brand-600 hover:border-brand-200"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
}
