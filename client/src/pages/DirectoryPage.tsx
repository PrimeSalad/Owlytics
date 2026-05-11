import { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/layout';
import { StudentsPage } from './StudentsPage';
import { MembersPage } from './MembersPage';
import { cn } from '@/lib/utils';
import { GraduationCap, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function DirectoryPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'students' | 'members'>('students');

  const canSeeMembers = user?.role === 'President' || user?.role === 'Secretary';

  // If user can't see members and somehow gets to that tab, reset to students
  useEffect(() => {
    if (!canSeeMembers && activeTab === 'members') {
      setActiveTab('students');
    }
  }, [canSeeMembers, activeTab]);

  return (
    <PageWrapper
      title="People Directory"
      description="Manage student records and organization member accounts."
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-surface-border">
          <button
            onClick={() => setActiveTab('students')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === 'students' 
                ? "border-brand-500 text-brand-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
            )}
          >
            <GraduationCap className="h-4 w-4" />
            Student List
          </button>
          
          {canSeeMembers && (
            <button
              onClick={() => setActiveTab('members')}
              className={cn(
                "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'members' 
                  ? "border-brand-500 text-brand-600" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
              )}
            >
              <Users className="h-4 w-4" />
              Organization Staff
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mt-4">
          {activeTab === 'students' ? (
            <div className="-mt-14">
              <StudentsPage isComponent />
            </div>
          ) : (
            <div className="-mt-14">
              <MembersPage isComponent />
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

