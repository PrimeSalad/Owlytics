import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import { COLUMNS } from './constants';
import { DraggableCard } from './DraggableCard';

export function DroppableColumn({ col, tasks, canCreate, onTaskClick }: {
  col: typeof COLUMNS[number]; tasks: Task[]; canCreate: boolean; onTaskClick: (t: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const Icon = col.icon;
  return (
    <div className="flex flex-col gap-3">
      <div className={cn('flex items-center gap-2 rounded-t-xl border-b-2 bg-gradient-to-br px-4 py-3',
        col.color === 'red'   && 'border-red-300 from-red-50 to-red-100',
        col.color === 'blue'  && 'border-blue-400 from-blue-50 to-blue-100',
        col.color === 'green' && 'border-green-400 from-green-50 to-green-100',
      )}>
        <Icon className={cn('h-4 w-4', `text-${col.color}-600`)} />
        <h3 className={cn('text-sm font-bold uppercase tracking-wider', `text-${col.color}-700`)}>{col.label}</h3>
        <span className={cn('ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
          col.color === 'red'   && 'bg-red-200 text-red-700',
          col.color === 'blue'  && 'bg-blue-200 text-blue-700',
          col.color === 'green' && 'bg-green-200 text-green-700',
        )}>{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className={cn('min-h-[120px] space-y-3 rounded-xl p-2 transition-colors', isOver && 'bg-brand-50 ring-2 ring-brand-300 ring-dashed')}>
        {tasks.length === 0 ? (
          <div className={cn('rounded-xl border-2 border-dashed py-8 text-center transition-colors', isOver ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50')}>
            <p className="text-xs text-slate-400">{isOver ? 'Drop here' : 'No tasks'}</p>
          </div>
        ) : tasks.map((task) => (
          <DraggableCard key={task._id} task={task} canCreate={canCreate} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  );
}
