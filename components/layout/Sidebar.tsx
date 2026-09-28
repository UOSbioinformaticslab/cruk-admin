'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users, UsersRound, Shield, Filter, LayoutDashboard, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '@/lib/api-client';
import { canManageUserAssignments, getAuthUser, setAuthUser } from '@/lib/auth-session';
import type { User } from '@/lib/types';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Teams', href: '/teams', icon: UsersRound },
  { name: 'Roles', href: '/roles', icon: Shield },
  { name: 'Cancer Type Filters', href: '/cancer-type-filters', icon: Filter },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authUser, setAuthUserState] = useState<User | null>(() => getAuthUser());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getAuthUser();
    if (!stored?.id) return;
    apiClient
      .getUser(stored.id)
      .then((fullUser) => {
        if (fullUser && typeof fullUser === 'object' && 'id' in fullUser) {
          setAuthUser(fullUser as User);
          setAuthUserState(fullUser as User);
        }
      })
      .catch(() => {});
  }, []);

  const isAdmin = canManageUserAssignments(authUser);

  const handleLogout = async () => {
    await apiClient.logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center border-b border-gray-800 px-6">
        <h1 className="text-xl font-bold text-white">CRUK Admin</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-800 p-4">
        {mounted && authUser?.email && (
          <div className="mb-3">
            <p className="truncate text-xs text-gray-400" title={authUser.email}>
              {authUser.email}
            </p>
            {isAdmin && (
              <span className="mt-1 inline-block rounded bg-green-900/50 px-2 py-0.5 text-xs text-green-300">
                Admin
              </span>
            )}
          </div>
        )}
        {mounted && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
            Log out
          </button>
        )}
      </div>
    </div>
  );
}
