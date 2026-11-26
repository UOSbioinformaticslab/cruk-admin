'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDeleteRole, useRolesQuery } from '@/hooks/use-roles';
import { Role } from '@/interfaces';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { RoleModal } from '@/modules/roles/RoleModal';

export default function RolesPage() {
  const [page, setPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, error } = useRolesQuery(page);
  const deleteMutation = useDeleteRole();

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this role?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error loading roles</h2>
            <p className="text-red-700">{errorMessage}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const roles = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2 inline" />
            Add Role
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Full Name</TableHeaderCell>
            <TableHeaderCell>Enabled</TableHeaderCell>
            <TableHeaderCell>Permissions</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {roles.map((role: Role) => (
              <TableRow key={role.id}>
                <TableCell>{role.id}</TableCell>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.full_name || '-'}</TableCell>
                <TableCell>{role.enabled ? 'Yes' : 'No'}</TableCell>
                <TableCell>{role.permissions?.length || 0}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="secondary" onClick={() => handleEdit(role)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(role.id)}>
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
          <RoleModal
            role={selectedRole}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedRole(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

