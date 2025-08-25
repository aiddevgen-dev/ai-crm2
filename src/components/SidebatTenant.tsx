'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  User, 
  Settings, 
  HelpCircle, 
  FileText,
  BarChart3,
  Shield
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/tenant-dashboard',
    icon: Home,
  },
  {
    name: 'My Profile',
    href: '/tenant-dashboard/profile',
    icon: User,
  },
  {
    name: 'Analytics',
    href: '/tenant-dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Reports',
    href: '/tenant-dashboard/reports',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/tenant-dashboard/settings',
    icon: Settings,
  },
  {
    name: 'Support',
    href: '/tenant-dashboard/support',
    icon: HelpCircle,
  },
  
];

export function SidebarTenant() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-orange-200 shadow-sm">
      {/* Logo/Brand */}
      <div className="flex items-center justify-center h-20 px-4 border-b border-orange-200">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-orange-500" />
          <h1 className="text-xl font-bold text-gray-900">Tenant Portal</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5',
                  isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-orange-200">
        <div className="text-xs text-gray-500 text-center">
          Tenant Portal v1.0
        </div>
      </div>
    </div>
  );
}