import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, ArrowUpDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: Array<Record<string, any>>;
  columns: Column[];
  title?: string;
  description?: string;
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  maxHeight?: string;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export function DataTable({
  data,
  columns,
  title,
  description,
  searchable = true,
  sortable = true,
  pagination = false,
  pageSize = 10,
  maxHeight = "400px"
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(row =>
      columns.some(column =>
        String(row[column.key])
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, columns]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig || !sortable) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig, sortable]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  const handleSort = (key: string) => {
    if (!sortable) return;

    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const renderSortIcon = (columnKey: string, sortable: boolean = true) => {
    if (!sortable) return null;

    const isActive = sortConfig?.key === columnKey;
    if (!isActive) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground opacity-50" />;
    }

    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4 text-primary" />
      : <ChevronDown className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="my-6 rounded-xl border border-border bg-card shadow-md overflow-hidden">
      {/* Header */}
      {(title || description || searchable) && (
        <div className="p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>

            {searchable && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto" style={{ maxHeight }}>
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider
                    ${(sortable && (column.sortable !== false)) ? 'cursor-pointer hover:bg-muted/80' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => (sortable && column.sortable !== false) && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2 group">
                    <span>{column.label}</span>
                    {renderSortIcon(column.key, column.sortable !== false)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-muted/20 transition-colors duration-150"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p>No data found</p>
            {searchTerm && (
              <p className="text-xs mt-1">Try adjusting your search terms</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} to{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`
                        px-3 py-1 text-sm rounded border transition-colors
                        ${currentPage === page
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background hover:bg-muted'
                        }
                      `}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Usage example:
/*
<DataTable
  title="User Statistics"
  description="Overview of user activity and engagement"
  data={[
    { name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', articles: 15 },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Active', articles: 8 },
    { name: 'Bob Johnson', email: 'bob@example.com', role: 'Author', status: 'Inactive', articles: 3 },
  ]}
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'articles', label: 'Articles', sortable: true }
  ]}
  searchable={true}
  sortable={true}
  pagination={true}
  pageSize={5}
/>
*/