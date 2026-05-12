import { useDraggable } from '@dnd-kit/core';
import { Eye, GripVertical, MessageSquare } from 'lucide-react';
import { Card, CardBody } from '@/components/ui';
import { cn, roleLabel } from '@/lib/utils';
import type { Task } from '@/types';
import { ALL_ROLES, ROLE_COLORS } from './constants';

export function DraggableCard({ task, canCreate, onClick }: {
  task: Task; canCreate: boolean; onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn('rounded-xl outline-none', isDragging && 'opacity-40')}>
      <Card className="group cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:-translate-y-0.5" onClick={isDragging ? undefined : onClick}>
        <CardBody className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400" />
            <div className="flex-1 space-y-2">
              <h4 className="font-semibold text-slate-900 leading-snug group-hover:text-brand-600 transition">{task.title}</h4>
              {task.description && <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>}
              {canCreate && task.visible_to?.length > 0 && task.visible_to.length < ALL_ROLES.length && (
                <div className="flex flex-wrap gap-1">
                  {task.visible_to.map((role) => (
                    <span key={role} className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', ROLE_COLORS[role])}>
                      <Eye className="h-2.5 w-2.5" />{roleLabel(role)}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MessageSquare className="h-3.5 w-3.5" /><span>{task.comments.length}</span>
                </div>
                {task.assignees.length > 0 && (
                  <div className="ml-auto flex -space-x-1.5">
                    {task.assignees.slice(0, 4).map((a) => (
                      <div key={a._id} title={`${a.name.first} ${a.name.last}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-[9px] font-bold text-white">
                        {a.name.first[0]}{a.name.last[0]}
                      </div>
                    ))}
                    {task.assignees.length > 4 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-bold text-slate-600">
                        +{task.assignees.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
