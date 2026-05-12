import { Users, Zap, Shield, CheckCircle } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardBody, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import mascotImg from '@/assets/mascot.png';

export function AboutPage() {
  return (
    <PageWrapper title="About Owlytics" description="Student organization management system.">
      <div className="space-y-6">
        {/* Hero Card */}
        <Card>
          <CardBody className="relative overflow-hidden p-10">
            {/* Background decoration */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-brand-400/20 to-brand-600/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-600/20 blur-3xl" />
            
            <div className="relative space-y-6 text-center">
              <img src={mascotImg} alt="Owlytics Mascot" className="mx-auto h-32 w-32 object-contain drop-shadow-2xl" />
              <div>
                <h2 className="text-3xl font-black text-slate-900">Owlytics Command Center</h2>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <Badge variant="default" className="bg-brand-500 text-white font-bold">v1.0.0</Badge>
                  <Badge variant="default" className="bg-green-500 text-white font-bold">Production Ready</Badge>
                </div>
              </div>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600">
                A comprehensive student monitoring and organization management system designed for <span className="font-bold text-brand-600">BSIT/BSIS</span> student organizations. 
                Streamline attendance tracking, event management, task collaboration, and reporting all in one powerful platform.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Features Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, title: 'Role-Based Access', desc: 'Secure permissions for every role', color: 'from-blue-500 to-blue-600' },
            { icon: Zap, title: 'Real-Time Updates', desc: 'Live collaboration and sync', color: 'from-yellow-500 to-orange-600' },
            { icon: Shield, title: 'Secure & Reliable', desc: 'Built with modern security', color: 'from-green-500 to-green-600' },
            { icon: CheckCircle, title: 'Easy to Use', desc: 'Intuitive and clean interface', color: 'from-purple-500 to-purple-600' },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx}>
                <CardBody className="p-6 text-center space-y-3 transition hover:shadow-lg">
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{feature.title}</h4>
                  <p className="text-xs text-slate-500">{feature.desc}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Key Features */}
        <Card>
          <CardBody className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Key Features</h3>
              <Badge variant="default" className="bg-slate-100 text-slate-700">6 Core Modules</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: 'QR Code Attendance', desc: 'Real-time scanning with instant verification and duplicate prevention' },
                { title: 'Bulk Student Management', desc: 'CSV import support with section-based organization and validation' },
                { title: 'Kanban Task Board', desc: 'Drag-and-drop task management with threaded discussions and mentions' },
                { title: 'Event Planning', desc: 'Create and manage events with attendance tracking and analytics' },
                { title: 'Comprehensive Reports', desc: 'Generate detailed reports with export capabilities and visualizations' },
                { title: 'Role Management', desc: 'Fine-grained access control for President, Secretary, Officer, and Attendance roles' },
              ].map((feature, idx) => (
                <div key={idx} className="flex gap-3 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 transition hover:border-brand-300 hover:shadow-md">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-800">{feature.title}</h5>
                    <p className="text-xs leading-relaxed text-slate-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Development Team */}
        <Card>
          <CardBody className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Development Team</h3>
              <Badge variant="default" className="bg-purple-100 text-purple-700 font-bold">DotOrbit</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { name: 'Gene Elpie Landoy', roles: ['Lead Fullstack Developer', 'UI/UX Designer', 'System Architect', 'Frontend Engineer', 'Backend Engineer', 'Database Designer'], color: 'from-brand-500 to-brand-600' },
                { name: 'Jayson Nunez', roles: ['Backend Developer', 'Database Engineer', 'API Developer', 'Server Management'], color: 'from-green-500 to-green-600' },
                { name: 'Mark John Matining', roles: ['Backend Developer', 'API Specialist', 'Integration Engineer', 'System Testing'], color: 'from-purple-500 to-purple-600' },
              ].map((dev, idx) => (
                <div key={idx} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 text-center transition hover:border-brand-300 hover:shadow-lg">
                  <div className={cn('mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold text-white shadow-lg ring-4 ring-white', dev.color)}>
                    {dev.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{dev.name}</h4>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {dev.roles.map((role, i) => (
                      <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-6 text-center">
              <p className="text-xs text-slate-400">
                © 2026 Owlytics Command Center by DotOrbit. All rights reserved.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
}
