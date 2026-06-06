import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  ClipboardList,
  FileSpreadsheet,
  Receipt,
  Activity,
  LogOut,
  Settings,
  TrendingUp,
  Briefcase
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface MenuItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['Admin', 'Manager', 'Officer', 'Vendor'],
  },
  {
    title: 'Vendors',
    path: '/vendors',
    icon: Users,
    roles: ['Admin', 'Officer'],
  },
  {
    title: 'RFQs',
    path: '/rfqs',
    icon: FileText,
    roles: ['Admin', 'Manager', 'Officer', 'Vendor'],
  },
  {
    title: 'Quotations',
    path: '/quotations',
    icon: ClipboardList,
    roles: ['Admin', 'Officer', 'Vendor'],
  },
  {
    title: 'Approvals',
    path: '/approvals',
    icon: FileCheck,
    roles: ['Admin', 'Manager'],
  },
  {
    title: 'Purchase Orders',
    path: '/purchase-orders',
    icon: FileSpreadsheet,
    roles: ['Admin', 'Manager', 'Officer', 'Vendor'],
  },
  {
    title: 'Invoices',
    path: '/invoices',
    icon: Receipt,
    roles: ['Admin', 'Manager', 'Officer', 'Vendor'],
  },
  {
    title: 'Activity Logs',
    path: '/activity-logs',
    icon: Activity,
    roles: ['Admin', 'Manager', 'Officer'],
  },
  {
    title: 'Analytics Reports',
    path: '/reports',
    icon: TrendingUp,
    roles: ['Admin', 'Manager', 'Officer'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuthStore();
  const userRole = user?.role || 'Vendor';

  const filteredMenuItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[var(--sidebar-width)] bg-white border-r border-surface-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Section */}
        <div>
          <div className="h-[var(--topbar-height)] px-6 flex items-center gap-3 border-b border-surface-150">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-sm tracking-wider shadow-md shadow-brand-500/20">
              VB
            </div>
            <div>
              <span className="font-extrabold text-surface-900 tracking-tight text-lg">
                Vendor<span className="text-brand-600">Bridge</span>
              </span>
              <span className="block text-[10px] text-surface-400 font-semibold uppercase tracking-wider -mt-1">
                ERP System
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-190px)]">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-50 text-brand-600'
                        : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                    }`
                  }
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User profile & logout footer */}
        <div className="p-4 border-t border-surface-150 bg-surface-50/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-surface-900 truncate">
                {user?.name}
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 bg-brand-50/60 px-2 py-0.5 rounded-full mt-0.5">
                <Briefcase className="w-3 h-3" />
                <span>{userRole}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-danger-600 hover:bg-danger-50 rounded-xl text-sm font-medium transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
