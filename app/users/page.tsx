'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { User } from '@/lib/types';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { UserModal } from '@/components/users/UserModal';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page],
    queryFn: () => apiClient.getUsers({ page, per_page: 25 }),
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

  const users = data?.data || [];

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

        <Table>
          <TableHeader>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Organisation</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {users.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.organisation || '-'}</TableCell>
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

        {data && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {data.from} to {data.to} of {data.total} results
            </p>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.last_page}
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

