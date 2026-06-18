import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, Loader2, Info, GraduationCap, X, Users } from 'lucide-react';
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
  error?: string;
  hint?: string;
  /** Allow removing the current assignment. Emits an empty string when cleared. */
  clearable?: boolean;
}

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

function yearLabel(year: number): string {
  return ORDINALS[year - 1] ? `${ORDINALS[year - 1]} Year` : `Year ${year}`;
}

export const SectionSelector: React.FC<SectionSelectorProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Search section (e.g. BSI/T 4-G)',
  onlyActiveDirectory = false,
  error,
  hint,
  clearable = true,
}) => {
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const { data } = await api.get(`/sections?onlyActive=${onlyActiveDirectory}`);
        setSections(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load sections:', err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, [onlyActiveDirectory]);

  // Close the dropdown (and reset the search) on outside click or Escape.
  const close = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const selectedSection = sections.find((s) => s.id === value);

  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (s) =>
        s.display_name.toLowerCase().includes(q) ||
        s.course_code.toLowerCase().includes(q) ||
        s.course_name.toLowerCase().includes(q) ||
        s.block.toLowerCase().includes(q)
    );
  }, [sections, searchTerm]);

  return (
    <div className={cn('relative w-full space-y-1.5', className)} ref={containerRef}>
      <div className="flex items-center justify-between gap-2 ml-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Assigned Section {required && <span className="text-brand-500">*</span>}
        </label>
        {selectedSection && clearable && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              close();
            }}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition hover:text-danger-600"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => setIsOpen((v) => !v)}
          aria-invalid={!!error}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-xl border bg-white px-4 text-sm transition-all',
            error
              ? 'border-danger-400 ring-4 ring-danger-500/10'
              : isOpen
                ? 'border-brand-500 ring-4 ring-brand-500/10'
                : 'border-slate-200 hover:border-slate-300',
            disabled && 'cursor-not-allowed opacity-50 bg-slate-50',
            !value && 'text-slate-400'
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <GraduationCap className={cn('h-4 w-4 shrink-0', value ? 'text-brand-500' : 'text-slate-400')} />
            <span className="truncate font-semibold">
              {selectedSection ? selectedSection.display_name : placeholder}
            </span>
            {selectedSection && (
              <span className="hidden shrink-0 items-center gap-1 rounded-md border border-brand-100 bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 sm:inline-flex">
                <Users className="h-3 w-3" />
                {selectedSection.total_students}
              </span>
            )}
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
                placeholder="Type to filter sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-lg border-none bg-transparent pl-10 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            {/* List */}
            <div className="max-h-[280px] overflow-y-auto p-1.5 custom-scrollbar">
              {loadError ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="rounded-full bg-danger-50 p-3 mb-2">
                    <Info className="h-5 w-5 text-danger-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Couldn't load sections</p>
                  <p className="text-[11px] text-slate-500 mt-1">Check your connection and reopen this menu.</p>
                </div>
              ) : filteredSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="rounded-full bg-slate-50 p-3 mb-2">
                    <Info className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No sections found</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {searchTerm
                      ? `Nothing matches "${searchTerm.trim()}"`
                      : onlyActiveDirectory
                        ? 'Add students to a section in the Student List first — only sections with students appear here.'
                        : 'No sections are available yet.'}
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
                          close();
                        }}
                        className={cn(
                          'flex flex-col gap-1.5 rounded-lg px-3 py-2.5 text-left transition-all group border',
                          isActive
                            ? 'bg-brand-50 border-brand-200'
                            : 'hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">{section.course_code}</span>
                          {isActive && <Check className="h-4 w-4 text-brand-600" />}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-xs text-slate-500 font-medium truncate">{section.course_name}</span>
                            <span className="text-xs font-semibold text-slate-600">
                              {yearLabel(section.academic_year)} · Section {section.block}
                            </span>
                          </div>
                          <span
                            className={cn(
                              'flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors',
                              isActive
                                ? 'border border-brand-200 bg-brand-100 text-brand-700'
                                : 'border border-slate-200 bg-white text-slate-700 group-hover:border-slate-300'
                            )}
                          >
                            <Users className="h-3 w-3" />
                            {section.total_students}
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

      {error ? (
        <p className="ml-1 text-xs font-medium text-danger-600">{error}</p>
      ) : hint ? (
        <p className="ml-1 text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
};

export default SectionSelector;
