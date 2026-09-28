'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { formatUserName, unwrapPaginatedList } from '@/lib/api-response';
import { canManageUserAssignments, getAuthUser } from '@/lib/auth-session';
import { User } from '@/lib/types';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { UserModal } from '@/components/users/UserModal';

function buildPageItems(current: number, last: number): Array<number | '...'> {
  if (!Number.isFinite(current) || !Number.isFinite(last) || last <= 1) return [1];

  const clampedCurrent = Math.min(Math.max(1, current), last);
  const pages = new Set<number>();

  pages.add(1);
  pages.add(last);
  for (let p = clampedCurrent - 2; p <= clampedCurrent + 2; p++) {
    if (p >= 1 && p <= last) pages.add(p);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const items: Array<number | '...'> = [];

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    const prev = sorted[i - 1];
    if (prev != null && p - prev > 1) items.push('...');
    items.push(p);
  }

  return items;
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [autoJumpToNewest, setAutoJumpToNewest] = useState(true);
  const [jumpToPage, setJumpToPage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authUser] = useState<User | null>(() => getAuthUser());
  const isAdmin = canManageUserAssignments(authUser);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () =>
      apiClient.getUsers({
        page,
        per_page: 25,
        // API requires at least 3 chars (otherwise 400)
        filterNames: search.trim().length >= 3 ? search.trim() : undefined,
      }),
    // When not searching, jump to the last page once so newest users appear first.
    // The API list is ordered oldest->newest and doesn't seem to support sort=desc.
    onSuccess: (result) => {
      if (!autoJumpToNewest) return;
      if (search.trim()) return;

      const { meta: pagination } = unwrapPaginatedList<User>(result);
      const lastPage = pagination.last_page;
      if (page === 1 && lastPage && lastPage > 1) {
        setAutoJumpToNewest(false);
        setPage(lastPage);
      } else {
        setAutoJumpToNewest(false);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isNetworkError = errorMessage.includes('Network Error') || errorMessage.includes('ECONNREFUSED');
    const isAuthError = errorMessage.includes('401') || errorMessage.includes('Unauthorized');
    
    return (
      <DashboardLayout>
        <div className="p-8 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error loading users</h2>
            <p className="text-red-700 mb-4">{errorMessage}</p>
            {isNetworkError && (
              <div className="text-sm text-red-600">
                <p>• Make sure the API is running at <code className="bg-red-100 px-2 py-1 rounded">http://localhost:8100/api</code></p>
                <p>• Check your network connection</p>
              </div>
            )}
            {isAuthError && (
              <div className="text-sm text-red-600">
                <p>• Authentication required. Please log in first.</p>
                <p>• Check if your token is valid</p>
              </div>
            )}
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Show error details</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      </DashboardLayout>
    );
  }

  const { items: users, meta: pagination } = unwrapPaginatedList<User>(data);
  const displayUsers = [...users].reverse();
  const currentPage = pagination.current_page ?? page;
  const lastPage = pagination.last_page ?? 1;
  const pageItems = buildPageItems(currentPage, lastPage);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2 inline" />
            Add User
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setAutoJumpToNewest(false);
              setSearch(e.target.value);
            }}
            placeholder="Search users by name…"
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md"
          />
          {search.trim() && (
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setPage(1);
                setAutoJumpToNewest(true);
                setSearch('');
              }}
            >
              Clear
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Organisation</TableHeaderCell>
            <TableHeaderCell>Teams</TableHeaderCell>
            <TableHeaderCell>Roles</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {displayUsers.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{formatUserName(user)}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.organisation || '-'}</TableCell>
                <TableCell>
                  {user.teams?.length
                    ? user.teams.map((t) => t.name).join(', ')
                    : '-'}
                </TableCell>
                <TableCell>
                  {user.roles?.length
                    ? user.roles.map((r) => r.full_name || r.name).join(', ')
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="secondary" onClick={() => handleEdit(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pagination.total != null && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {pagination.from} to {pagination.to} of {pagination.total} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>

              <div className="hidden items-center gap-1 sm:flex">
                {pageItems.map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-2 text-sm text-gray-500">
                        …
                      </span>
                    );
                  }
                  const p = item;
                  const isActive = p === currentPage;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={
                        isActive
                          ? 'rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white'
                          : 'rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100'
                      }
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <form
                className="hidden items-center gap-2 md:flex"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(jumpToPage);
                  if (!Number.isFinite(n)) return;
                  const target = Math.min(Math.max(1, Math.trunc(n)), lastPage);
                  setPage(target);
                  setJumpToPage('');
                }}
              >
                <input
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  placeholder="Page"
                  inputMode="numeric"
                  className="w-20 rounded-md border border-gray-300 px-2 py-2 text-sm"
                />
                <Button type="submit" variant="secondary" disabled={!jumpToPage.trim()}>
                  Go
                </Button>
              </form>

              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= lastPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {isModalOpen && (
          <UserModal
            user={selectedUser}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedUser(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

