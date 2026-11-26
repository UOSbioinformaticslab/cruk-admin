'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDeleteUser, useUsersQuery } from '@/hooks/use-users';
import { formatUserName, unwrapPaginatedList } from '@/utils/api-response';
import { buildPageItems } from '@/utils/pagination';
import { User } from '@/interfaces';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { UserModal } from '@/modules/users/UserModal';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [autoJumpToNewest, setAutoJumpToNewest] = useState(true);
  const [jumpToPage, setJumpToPage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = useUsersQuery(page, search, (result) => {
    if (!autoJumpToNewest || search.trim()) return;

    const { meta: pagination } = unwrapPaginatedList<User>(result);
    const lastPage = pagination.last_page;
    if (page === 1 && lastPage && lastPage > 1) {
      setAutoJumpToNewest(false);
      setPage(lastPage);
    } else {
      setAutoJumpToNewest(false);
    }
  });
  const deleteMutation = useDeleteUser();

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

