'use client';

import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { CancerTypeFilter } from '@/lib/types';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ChevronRight, ChevronDown, Plus, Edit } from 'lucide-react';
import { CancerTypeFilterModal } from '@/components/cancer-type-filters/CancerTypeFilterModal';

export default function CancerTypeFiltersPage() {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState<CancerTypeFilter | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cancer-type-filters'],
    queryFn: () => apiClient.getCancerTypeFilters(),
  });

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleCreate = () => {
    setSelectedFilter(null);
    setIsModalOpen(true);
  };

  const handleEdit = (filter: CancerTypeFilter) => {
    setSelectedFilter(filter);
    setIsModalOpen(true);
  };

  const renderFilterRow = (filter: CancerTypeFilter, level: number = 0): React.ReactNode => {
    const hasChildren = filter.children && filter.children.length > 0;
    const isExpanded = expandedRows.has(filter.id);

    return (
      <Fragment key={filter.id}>
        <TableRow className={level > 0 ? 'bg-gray-50' : ''}>
          <TableCell>
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleRow(filter.id)}
                  className="mr-2 text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!hasChildren && <span className="w-6" />}
              <span>{filter.id}</span>
            </div>
          </TableCell>
          <TableCell>{filter.filter_id}</TableCell>
          <TableCell>{filter.label}</TableCell>
          <TableCell>{filter.category || '-'}</TableCell>
          <TableCell>{filter.primary_group || '-'}</TableCell>
          <TableCell>{filter.count || '-'}</TableCell>
          <TableCell>{filter.level}</TableCell>
          <TableCell>
            <Button variant="secondary" onClick={() => handleEdit(filter)}>
              <Edit className="h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && filter.children?.map((child) => renderFilterRow(child, level + 1))}
      </Fragment>
    );
  };

  if (isLoading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error loading cancer type filters</h2>
            <p className="text-red-700">{errorMessage}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filters = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Cancer Type Filters</h1>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2 inline" />
            Add Filter
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Filter ID</TableHeaderCell>
            <TableHeaderCell>Label</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Primary Group</TableHeaderCell>
            <TableHeaderCell>Count</TableHeaderCell>
            <TableHeaderCell>Level</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {filters.map((filter: CancerTypeFilter) => renderFilterRow(filter))}
          </TableBody>
        </Table>

        {isModalOpen && (
          <CancerTypeFilterModal
            filter={selectedFilter}
            allFilters={filters}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedFilter(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
