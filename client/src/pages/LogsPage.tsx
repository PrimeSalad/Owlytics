import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PageWrapper } from '@/components/layout';
import { Card, Spinner } from '@/components/ui';
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
    return (
      log.details?.toLowerCase().includes(term) ||
      log.action_type.toLowerCase().includes(term) ||
      log.resource.toLowerCase().includes(term) ||
      actorName.includes(term)
    );
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-success-500/10 text-success-500 border-success-500/20';
      case 'UPDATE': return 'bg-warning-500/10 text-warning-500 border-warning-500/20';
      case 'DELETE': return 'bg-danger-500/10 text-danger-500 border-danger-500/20';
      case 'AUTH': return 'bg-brand-500/10 text-brand-500 border-brand-500/20';
      default: return 'bg-white/10 text-white border-white/20';
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
      icon={Activity}
    >
      <div className="text-sm text-white/40 mb-6">
        Comprehensive audit trail of system activities
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search logs by actor, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#080f0c] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <Spinner className="h-8 w-8 text-brand-500" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-white/40">
              No logs found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="bg-white/[0.02] border-b border-white/10 text-white/40 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Resource</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white/60 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {log.actor ? (
                        <div>
                          <div className="text-white font-medium">{log.actor.first_name} {log.actor.last_name}</div>
                          <div className="text-[10px] text-white/40">{log.actor.role}</div>
                        </div>
                      ) : (
                        <span className="text-white/40 italic">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getActionColor(log.action_type)}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-white/60">{log.resource}</span>
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </PageWrapper>
  );
}
