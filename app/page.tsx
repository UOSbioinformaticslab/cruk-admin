import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Users, UsersRound, Shield, Filter } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const stats = [
    { name: 'Users', href: '/users', icon: Users, color: 'bg-blue-500' },
    { name: 'Teams', href: '/teams', icon: UsersRound, color: 'bg-green-500' },
    { name: 'Roles', href: '/roles', icon: Shield, color: 'bg-purple-500' },
    { name: 'Cancer Type Filters', href: '/cancer-type-filters', icon: Filter, color: 'bg-orange-500' },
  ];

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="relative overflow-hidden rounded-lg bg-white px-6 py-5 shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className={`${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-lg font-semibold text-gray-900">Manage</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
