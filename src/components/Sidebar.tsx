'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  Calendar, 
  Mic, 
  BookOpen,
  Building2,
  Settings
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
  name: 'Manage Tenants',
  href: '/manage-tenants',
  icon: Settings,
},
  {
    name: 'Numbers',
    href: '/Numbers',
    icon: BookOpen,
  },
  {
    name: 'Purchased Numbers',
    href: '/Purchased_Numbers',
    icon: Users,
  },
  {
    name: 'Agents',
    href: '/agents',
    icon: Mic,
  },
  {
    name: 'Campaigns',
    href: '/campaigns',
    icon: Megaphone,
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: Users,
  },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: Calendar,
  },
  {
    name: 'Recordings',
    href: '/recordings',
    icon: Mic,
  },
  {
    name: 'Knowledge Base',
    href: '/knowledge',
    icon: BookOpen,
  },
  

];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-72 flex-col bg-white border-r border-slate-200 shadow-sm">
      {/* Logo */}
      <div className="flex h-20 items-center px-6 border-b border-slate-200 bg-gradient-to-r from-orange-600 to-amber-600">
        <Building2 className="h-10 w-10 text-white" />
        <span className="ml-3 text-2xl font-bold text-white">Outbound Calling</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-600'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-orange-600' : 'text-slate-500 group-hover:text-slate-600'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4">
        <div className="text-xs text-slate-500">
          Multi-Tenant CRM v1.0
        </div>
      </div>
    </div>
  );
}