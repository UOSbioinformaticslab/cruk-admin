import { Filter, LayoutDashboard, Shield, Users, UsersRound } from 'lucide-react';

export const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Teams', href: '/teams', icon: UsersRound },
  { name: 'Roles', href: '/roles', icon: Shield },
  { name: 'Cancer Type Filters', href: '/cancer-type-filters', icon: Filter },
];

export const dashboardLinks = [
  { name: 'Users', href: '/users', icon: Users, color: 'bg-blue-500' },
  { name: 'Teams', href: '/teams', icon: UsersRound, color: 'bg-green-500' },
  { name: 'Roles', href: '/roles', icon: Shield, color: 'bg-purple-500' },
  { name: 'Cancer Type Filters', href: '/cancer-type-filters', icon: Filter, color: 'bg-orange-500' },
];
