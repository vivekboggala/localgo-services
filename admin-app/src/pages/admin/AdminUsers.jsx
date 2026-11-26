import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Mail, Phone, CheckCircle2, Clock, Search, Download, ArrowUpDown, Shield } from 'lucide-react';
import { adminService } from '../../services/adminService';
import PaginationBar from '../../components/common/PaginationBar';
import {
  Avatar,
  Badge,
  BottomSheet,
  Button,
  EmptyState,
  Input,
  PageHeader,
  SkeletonTableRow,
  Tabs,
  showToast,
} from '../../components/ui';

const ROLE_TABS = [
  { key: 'ALL', label: 'All Accounts' },
  { key: 'CUSTOMER', label: 'Customers' },
  { key: 'PROVIDER', label: 'Providers' },
  { key: 'ADMIN', label: 'Admins' },
];

const exportUsersCsv = (rows) => {
  if (!rows.length) return;
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'EmailVerified'];
  const lines = [
    headers.join(','),
    ...rows.map((u) =>
      [u.id, u.name || '', u.email || '', u.phone || '', u.role || '', u.emailVerified ? 'Verified' : 'Unverified']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'localgo-users.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentCursor = cursorStack[cursorStack.length - 1];

  const loadUsers = useCallback(() => {
    setLoading(true);
    adminService.getAllCustomers(roleFilter, 15, currentCursor)
      .then((data) => {
        setUsers(data?.content || []);
        setNextCursor(data?.nextCursor || null);
        setHasMore(Boolean(data?.hasMore));
      })
      .catch((err) => showToast.error(err.response?.data?.message || 'Failed to load users.'))
      .finally(() => setLoading(false));
  }, [roleFilter, currentCursor]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = (nextRole) => {
    setRoleFilter(nextRole);
    setCursorStack([null]);
  };

  const displayedUsers = useMemo(() => {
    let list = [...users];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const na = (a.name || a.email || '').toLowerCase();
      const nb = (b.name || b.email || '').toLowerCase();
      return sortAsc ? na.localeCompare(nb) : nb.localeCompare(na);
    });
    return list;
  }, [users, search, sortAsc]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title="Users & Accounts"
        subtitle="Browse registered customers, service providers, and platform administrators"
        actions={
          <Button
            variant="secondary"
            disabled={displayedUsers.length === 0}
            onClick={() => exportUsersCsv(displayedUsers)}
            leftIcon={<Download className="w-4 h-4" />}
            className="min-h-[42px] py-1.5 px-3.5 text-ds-12"
          >
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <Tabs tabs={ROLE_TABS} activeTab={roleFilter} onChange={handleRoleChange} />

        <div className="w-full lg:w-72">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter current page by name or email..."
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-brand-white rounded-card border border-gray-200 p-4 shadow-card">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonTableRow key={i} />)}
        </div>
      ) : displayedUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="No accounts found"
          description="Try selecting another role tab or clearing your search."
        />
      ) : (
        <div className="bg-brand-white rounded-card border border-gray-200 shadow-card overflow-x-auto">
          <table className="w-full text-left border-collapse text-ds-12">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="py-3.5 px-5">
                  <button
                    type="button"
                    onClick={() => setSortAsc((p) => !p)}
                    className="inline-flex items-center gap-1 hover:text-brand-ink cursor-pointer"
                  >
                    User <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4">Email &amp; Phone</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedUsers.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name || u.email} size="sm" tone={u.role === 'ADMIN' ? 'ink' : 'yellow'} />
                      <div>
                        <div className="font-display font-bold text-ds-14 text-brand-ink">
                          {u.name || 'Unnamed User'}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">#{String(u.id).slice(0, 10)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-brand-ink font-medium">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> {u.email}
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {u.phone}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      tone={u.role === 'ADMIN' ? 'ink' : u.role === 'PROVIDER' ? 'accent' : 'neutral'}
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    {u.emailVerified ? (
                      <Badge tone="success" icon={<CheckCircle2 className="w-3 h-3" />}>Verified</Badge>
                    ) : (
                      <Badge tone="warning" icon={<Clock className="w-3 h-3" />}>Unverified</Badge>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(u);
                      }}
                      className="min-h-[36px] py-1 px-3 text-ds-12"
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaginationBar
        pageIndex={cursorStack.length - 1}
        hasPrev={cursorStack.length > 1}
        hasNext={hasMore && Boolean(nextCursor)}
        itemCount={users.length}
        loading={loading}
        onPrev={() => setCursorStack((prev) => prev.slice(0, -1))}
        onNext={() => nextCursor && setCursorStack((prev) => [...prev, nextCursor])}
      />

      <BottomSheet
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name || 'User Details'}
        subtitle={selectedUser ? `Account ID: ${selectedUser.id}` : ''}
        desktopPresentation="drawer"
      >
        {selectedUser && (
          <div className="space-y-5 text-ds-14">
            <div className="flex items-center gap-3.5 p-4 rounded-card bg-brand-ink text-brand-white">
              <Avatar name={selectedUser.name || selectedUser.email} size="lg" tone="yellow" />
              <div className="min-w-0">
                <div className="font-display font-bold text-ds-16 truncate">{selectedUser.name || 'Unnamed User'}</div>
                <div className="text-ds-12 text-gray-400 truncate">{selectedUser.email}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge tone="accent" icon={<Shield className="w-3 h-3" />}>{selectedUser.role}</Badge>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-card p-4 border border-gray-200 space-y-2.5 text-ds-12">
              <div className="flex justify-between">
                <span className="text-gray-600">Phone</span>
                <span className="font-bold text-brand-ink">{selectedUser.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email Verified</span>
                <span className="font-bold text-brand-ink">{selectedUser.emailVerified ? 'Yes' : 'No'}</span>
              </div>
              {selectedUser.city && (
                <div className="flex justify-between">
                  <span className="text-gray-600">City</span>
                  <span className="font-bold text-brand-ink">{selectedUser.city}</span>
                </div>
              )}
              {selectedUser.address && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-600 block mb-0.5">Address</span>
                  <span className="font-semibold text-brand-ink">{selectedUser.address}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
