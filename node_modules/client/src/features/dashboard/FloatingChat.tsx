import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Megaphone, Send, X, MessageCircle, MessageSquare, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const canBroadcast = user?.role === 'President' || user?.role === 'Secretary';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<Notification[]>('/notifications')).data,
    refetchInterval: 10000,
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => api.post('/notifications/broadcast', { title, message }),
    onSuccess: () => {
      toast.success('Announcement broadcasted!');
      setTitle('');
      setMessage('');
      setIsComposing(false);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Failed to broadcast'),
  });

  const announcements = notifications.filter(n => n.type === 'System');

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-floating-chat', handleOpenChat);
    return () => window.removeEventListener('open-floating-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, announcements]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[320px] sm:w-[400px] flex flex-col h-[500px] rounded-[2rem] border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
          {/* Header */}
          <div className="bg-brand-600 p-5 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <span className="font-black text-sm uppercase tracking-wider block">Org Feed</span>
                <span className="text-[10px] font-bold text-brand-100 uppercase tracking-widest">Official Channel</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-white/20 p-2 rounded-full transition-all hover:rotate-90"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50 scrollbar-hide"
          >
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-center">
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <Megaphone className="h-8 w-8 opacity-20" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest">No messages yet</p>
                <p className="text-[10px] font-medium text-slate-400 mt-1 max-w-[160px]">Official updates will appear here</p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="flex flex-col items-start gap-1 max-w-[85%]">
                  <div className="flex items-center gap-2 mb-1 ml-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-600">Admin</span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="rounded-3xl rounded-tl-none bg-white p-4 shadow-sm border border-slate-100 group transition-all hover:shadow-md">
                    <p className="text-xs font-black text-slate-800 mb-1.5">{ann.title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{ann.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer / Input Area */}
          <div className="p-4 border-t border-slate-100 bg-white">
            {isComposing ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-600">New Broadcast</span>
                  <button onClick={() => setIsComposing(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                </div>
                <Input 
                  placeholder="Subject (e.g. Urgent Meeting)" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-50 border-transparent focus:bg-white h-10 text-xs rounded-xl"
                />
                <textarea
                  placeholder="Write your announcement here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-xs text-slate-800 placeholder:text-slate-400 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[100px] resize-none"
                />
                <Button 
                  onClick={() => broadcastMutation.mutate()} 
                  disabled={!title.trim() || !message.trim() || broadcastMutation.isPending}
                  loading={broadcastMutation.isPending}
                  className="w-full h-12 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/20"
                >
                  <Send className="mr-2 h-4 w-4" /> Broadcast Now
                </Button>
              </div>
            ) : (
              canBroadcast && (
                <Button 
                  onClick={() => setIsComposing(true)}
                  variant="outline"
                  className="w-full border-dashed border-slate-300 hover:border-brand-300 hover:bg-brand-50 text-slate-500 hover:text-brand-600 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Megaphone className="mr-2 h-4 w-4" /> New Announcement
                </Button>
              )
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group relative overflow-hidden",
          isOpen ? "bg-brand-700" : "bg-brand-600 hover:bg-brand-700"
        )}
      >
        <div className={cn(
          "transition-all duration-500",
          isOpen ? "rotate-180 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}>
          <MessageCircle className="h-7 w-7 text-white" />
        </div>
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500",
          isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-0 opacity-0"
        )}>
          <X className="h-7 w-7 text-white" />
        </div>
        
        {!isOpen && announcements.length > 0 && (
          <span className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-danger-500 text-[10px] font-black text-white ring-4 ring-white">
            {announcements.length}
          </span>
        )}
      </button>
    </div>
  );
}
