import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  UserCheck,
  UserX,
  Eye,
  Shield,
  Briefcase,
  User,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Mail,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import {
  Card,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  Pagination,
  LoadingSpinner,
  EmptyState,
  useToast,
} from '../../components/ui';
import { adminService } from '../../api';
import { useAuth } from '../../context';

const ROLE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'CANDIDATE', label: 'Candidates' },
  { value: 'RECRUITER', label: 'Recruiters' },
  { value: 'ADMIN', label: 'Administrators' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Account Statuses' },
  { value: 'true', label: 'Enabled / Active' },
  { value: 'false', label: 'Disabled / Suspended' },
];

export const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [enabledFilter, setEnabledFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [viewingUser, setViewingUser] = useState(null);
  const [toggleUserAction, setToggleUserAction] = useState(null); // { user, nextEnabled: boolean }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [keyword]);

  // Load Users from Backend
  useEffect(() => {
    let isCancelled = false;

    const fetchUsers = async () => {
      try {
        setError(null);
        const params = {
          page: currentPage - 1,
          size: 10,
          sort: 'createdAt,desc',
        };

        if (roleFilter !== 'ALL') params.role = roleFilter;
        if (enabledFilter !== 'ALL') params.enabled = enabledFilter === 'true';
        if (debouncedKeyword) params.keyword = debouncedKeyword;

        const res = await adminService.getUsers(params);
        if (isCancelled) return;
        if (res.success && res.data) {
          setUsers(res.data.content || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalElements(res.data.totalElements || 0);
        } else {
          setError(res.message || 'Failed to load user directory.');
        }
      } catch (err) {
        if (isCancelled) return;
        setError(err.response?.data?.message || err.message || 'Failed to connect to users service.');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchUsers();
    return () => {
      isCancelled = true;
    };
  }, [currentPage, roleFilter, enabledFilter, debouncedKeyword, refreshKey]);

  // Handle Toggle User Enabled / Disabled
  const handleConfirmToggle = async () => {
    if (!toggleUserAction) return;
    const { user, nextEnabled } = toggleUserAction;

    // Frontend validation: admin cannot disable own account
    const isSelf =
      (currentUser?.id && String(currentUser.id) === String(user.id)) ||
      (currentUser?.email && currentUser.email.toLowerCase() === user.email.toLowerCase());

    if (isSelf && !nextEnabled) {
      const msg = 'You cannot disable your own administrator account.';
      setError(msg);
      toast.warning(msg);
      setToggleUserAction(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await adminService.updateUserEnabled(user.id, nextEnabled);
      if (res.success) {
        const msg = `User "${user.email}" has been successfully ${nextEnabled ? 'enabled' : 'disabled'}.`;
        setSuccessMessage(msg);
        toast.success(msg);
        setToggleUserAction(null);
        setIsLoading(true);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update user status.';
      setError(msg);
      toast.error(msg);
      setToggleUserAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View User Details
  const handleOpenDetails = async (targetUser) => {
    try {
      const res = await adminService.getUser(targetUser.id);
      if (res.success && res.data) {
        setViewingUser(res.data);
      } else {
        setViewingUser(targetUser);
      }
    } catch {
      setViewingUser(targetUser);
    }
  };

  const roleStats = useMemo(() => {
    const candidates = users.filter((u) => u.role === 'CANDIDATE').length;
    const recruiters = users.filter((u) => u.role === 'RECRUITER').length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    return { candidates, recruiters, admins };
  }, [users]);

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <DashboardLayout
      role="admin"
      title="User Management & Governance"
      breadcrumb="Admin Center / Users"
    >
      <div className="space-y-6">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-slate-50 border-slate-200">
            <Card.Body className="p-4 text-center">
              <div className="text-xs font-medium text-slate-500">Directory Total</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalElements}</div>
            </Card.Body>
          </Card>
          <Card className="bg-blue-50/60 border-blue-200">
            <Card.Body className="p-4 text-center">
              <div className="text-xs font-medium text-blue-700">Candidates (Page)</div>
              <div className="text-2xl font-bold text-blue-950 mt-1">{roleStats.candidates}</div>
            </Card.Body>
          </Card>
          <Card className="bg-emerald-50/60 border-emerald-200">
            <Card.Body className="p-4 text-center">
              <div className="text-xs font-medium text-emerald-700">Recruiters (Page)</div>
              <div className="text-2xl font-bold text-emerald-950 mt-1">{roleStats.recruiters}</div>
            </Card.Body>
          </Card>
          <Card className="bg-amber-50/60 border-amber-200">
            <Card.Body className="p-4 text-center">
              <div className="text-xs font-medium text-amber-700">Admins (Page)</div>
              <div className="text-2xl font-bold text-amber-950 mt-1">{roleStats.admins}</div>
            </Card.Body>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card>
          <Card.Body className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search users by email address..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  leftIcon={<Search size={16} />}
                />
              </div>

              <div>
                <Select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                    setIsLoading(true);
                  }}
                  options={ROLE_FILTER_OPTIONS}
                />
              </div>

              <div>
                <Select
                  value={enabledFilter}
                  onChange={(e) => {
                    setEnabledFilter(e.target.value);
                    setCurrentPage(1);
                    setIsLoading(true);
                  }}
                  options={STATUS_FILTER_OPTIONS}
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Users Table */}
        <Card>
          <Card.Body noPadding>
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <LoadingSpinner message="Loading user directory..." />
              </div>
            ) : users.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="No Users Found"
                  description={
                    keyword || roleFilter !== 'ALL' || enabledFilter !== 'ALL'
                      ? 'No user accounts match your search and filter criteria.'
                      : 'No users have registered on the platform yet.'
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">User ID & Email</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4">Registration Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {users.map((item) => {
                      const isSelf =
                        (currentUser?.id && String(currentUser.id) === String(item.id)) ||
                        (currentUser?.email &&
                          currentUser.email.toLowerCase() === item.email.toLowerCase());

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/75 transition-colors">
                          {/* User ID & Email */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                                {item.email?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  {item.email}
                                  {isSelf && (
                                    <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 font-mono">
                                  UID: #{item.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="p-4">
                            {item.role === 'ADMIN' && (
                              <Badge variant="warning" className="flex items-center gap-1 w-fit">
                                <Shield size={12} />
                                Administrator
                              </Badge>
                            )}
                            {item.role === 'RECRUITER' && (
                              <Badge variant="success" className="flex items-center gap-1 w-fit">
                                <Briefcase size={12} />
                                Recruiter
                              </Badge>
                            )}
                            {item.role === 'CANDIDATE' && (
                              <Badge variant="primary" className="flex items-center gap-1 w-fit">
                                <User size={12} />
                                Candidate
                              </Badge>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            {item.enabled ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active / Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Suspended / Disabled
                              </span>
                            )}
                          </td>

                          {/* Registration Date */}
                          <td className="p-4 text-xs text-slate-500">
                            {formatDate(item.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Details Modal Trigger */}
                              <Button
                                variant="ghost"
                                size="sm"
                                title="View User Record"
                                onClick={() => handleOpenDetails(item)}
                              >
                                <Eye size={15} />
                              </Button>

                              {/* Toggle Enabled / Disabled */}
                              {item.enabled ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={isSelf ? 'Cannot disable self' : 'Suspend user account'}
                                  disabled={isSelf}
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                                  onClick={() =>
                                    setToggleUserAction({ user: item, nextEnabled: false })
                                  }
                                >
                                  <UserX size={15} />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Re-activate user account"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() =>
                                    setToggleUserAction({ user: item, nextEnabled: true })
                                  }
                                >
                                  <UserCheck size={15} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  setIsLoading(true);
                }}
              />
            </div>
          )}
        </Card>

        {/* User Details Modal */}
        <Modal
          isOpen={!!viewingUser}
          onClose={() => setViewingUser(null)}
          title="User Account Details"
          subtitle="Identity, permission role, and platform registration metadata"
          size="md"
        >
          {viewingUser && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
                  {viewingUser.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{viewingUser.email}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-500">
                      ID: #{viewingUser.id}
                    </span>
                    <span className="text-slate-300">•</span>
                    {viewingUser.enabled ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                        <UserX size={12} /> Suspended
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <Shield size={12} /> Security Role
                  </div>
                  <div className="font-bold text-slate-900">{viewingUser.role}</div>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <Calendar size={12} /> Registered On
                  </div>
                  <div className="font-medium text-slate-900">
                    {formatDate(viewingUser.createdAt)}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
                <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Mail size={12} /> Email Communication Channel
                </div>
                <div className="text-sm text-slate-700 break-all">{viewingUser.email}</div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Passwords and authentication credentials are encrypted using BCrypt and are never exposed via platform administration APIs.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingUser(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Confirmation Modal for Enable / Disable */}
        <Modal
          isOpen={!!toggleUserAction}
          onClose={() => setToggleUserAction(null)}
          title={
            toggleUserAction?.nextEnabled
              ? 'Re-activate User Account'
              : 'Suspend User Account'
          }
          subtitle="Confirm administrative status modification"
          size="sm"
        >
          {toggleUserAction && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-slate-600">
                Are you sure you want to{' '}
                <strong className={toggleUserAction.nextEnabled ? 'text-emerald-700' : 'text-rose-700'}>
                  {toggleUserAction.nextEnabled ? 'enable and restore' : 'suspend and disable'}
                </strong>{' '}
                the account for <span className="font-semibold text-slate-900">{toggleUserAction.user.email}</span>?
              </p>

              {!toggleUserAction.nextEnabled && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-800">
                  When disabled, the user will be blocked from logging into the platform and API requests will be rejected.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setToggleUserAction(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant={toggleUserAction.nextEnabled ? 'primary' : 'error'}
                  onClick={handleConfirmToggle}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : toggleUserAction.nextEnabled ? 'Enable Account' : 'Suspend Account'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
