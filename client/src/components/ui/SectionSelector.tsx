import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, Loader2, Info, GraduationCap } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

export interface SectionOption {
  id: string;
  course_code: string;
  course_name: string;
  academic_year: number;
  block: string;
  display_name: string;
  total_students: number;
}

export interface SectionSelectorProps {
  value?: string;
  onChange: (sectionId: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  onlyActiveDirectory?: boolean;
}

export const SectionSelector: React.FC<SectionSelectorProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Search section (e.g. BSI/T 4-G)',
  onlyActiveDirectory = false,
}) => {
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/sections?onlyActive=${onlyActiveDirectory}`);
        setSections(data || []);
      } catch (err) {
        console.error('Failed to load sections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, [onlyActiveDirectory]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSection = sections.find((s) => s.id === value);

  const filteredSections = sections.filter((s) =>
    s.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={cn('relative w-full space-y-1.5', className)} ref={containerRef}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
        Assigned Section {required && <span className="text-brand-500">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm transition-all',
            isOpen ? 'border-brand-500 ring-4 ring-brand-500/10' : 'hover:border-slate-300',
            disabled && 'cursor-not-allowed opacity-50 bg-slate-50',
            !value && 'text-slate-400'
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <GraduationCap className={cn('h-4 w-4', value ? 'text-brand-500' : 'text-slate-400')} />
            <span className="truncate font-semibold">
              {selectedSection ? selectedSection.display_name : placeholder}
            </span>
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
          )}
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Search Input */}
            <div className="relative border-b border-slate-100 p-2 bg-slate-50/50">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Type to filter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-lg border-none bg-transparent pl-10 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            {/* List */}
            <div className="max-h-[280px] overflow-y-auto p-1.5 custom-scrollbar">
              {filteredSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="rounded-full bg-slate-50 p-3 mb-2">
                    <Info className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No sections found</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                    {onlyActiveDirectory ? 'Only sections in Student Directory are shown' : 'Try a different search term'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 py-1">
                  {filteredSections.map((section) => {
                    const isActive = section.id === value;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => {
                          onChange(section.id);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className={cn(
                          'flex flex-col gap-1.5 rounded-lg px-3 py-2.5 text-left transition-all group border',
                          isActive 
                            ? 'bg-brand-50 border-brand-200' 
                            : 'hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">{section.course_code === 'BSIT' ? 'BSI/T' : section.course_code}</span>
                          {isActive && <Check className="h-4 w-4 text-brand-600" />}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-xs text-slate-500 font-medium">{section.course_name}</span>
                            <span className="text-xs font-semibold text-slate-600">{['1st', '2nd', '3rd', '4th'][section.academic_year - 1]} Year - Section {section.block}</span>
                          </div>
                          <span className={cn(
                            'text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors',
                            isActive ? 'border-brand-200 bg-brand-100 text-brand-700' : 'border border-slate-200 bg-white text-slate-700 group-hover:border-slate-300'
                          )}>
                            {section.total_students} students
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionSelector;
