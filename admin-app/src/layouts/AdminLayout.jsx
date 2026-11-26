import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Calendar,
  Star,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { adminService } from '../services/adminService';
import { Avatar, BottomSheet, Button, Logo } from '../components/ui';

const ROUTE_LABELS = {
  '/dashboard': 'Dashboard',
  '/providers': 'Providers',
  '/users': 'Users',
  '/bookings': 'Bookings',
  '/reviews': 'Reviews',
};

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);
  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const loadCounts = () => {
      adminService.getDashboardStats()
        .then((data) => setPendingCount(data?.pendingVerifications || 0))
        .catch(() => {});
      adminService.getAllProviders('PENDING', '', 6, null)
        .then((data) => setPendingAlerts(data?.content || []))
        .catch(() => {});
    };
    loadCounts();
    const handleRefresh = () => loadCounts();
    window.addEventListener('localgo:admin-refresh', handleRefresh);
    return () => window.removeEventListener('localgo:admin-refresh', handleRefresh);
  }, []);

  const currentSection = useMemo(() => {
    const entry = Object.entries(ROUTE_LABELS).find(([prefix]) => pathname.startsWith(prefix));
    return entry ? entry[1] : 'Overview';
  }, [pathname]);

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    const q = globalSearch.trim();
    if (!q) return;
    navigate(`/providers?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = async () => {
    setAvatarOpen(false);
    await logout();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/providers', label: 'Providers', icon: ShieldCheck, badge: pendingCount },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/bookings', label: 'Bookings', icon: Calendar },
    { to: '/reviews', label: 'Reviews', icon: Star },
  ];

  const renderLinks = (isCollapsed = false, onNavigate = null) => (
    <nav aria-label="Admin sidebar navigation" className="space-y-1.5">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            title={isCollapsed ? link.label : undefined}
            className={({ isActive }) =>
              `flex items-center justify-between gap-2.5 min-h-[46px] px-3.5 py-2.5 rounded-card font-display font-bold text-ds-14 transition-all duration-150 ${
                isActive
                  ? 'bg-brand-yellow text-brand-ink shadow-card'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-brand-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'mx-auto' : ''}`}>
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                  {!isCollapsed && <span className="truncate">{link.label}</span>}
                </span>
                {!isCollapsed && typeof link.badge === 'number' && link.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[11px] font-extrabold rounded-pill shrink-0 ${
                      isActive ? 'bg-brand-ink text-brand-yellow' : 'bg-status-warning text-brand-ink'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 text-brand-ink">
      {/* Desktop Ink-Black Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex ${
          collapsed ? 'w-20' : 'w-64'
        } bg-brand-ink text-brand-white min-h-screen flex-col justify-between p-4 border-r border-gray-900 shrink-0 sticky top-0 h-screen transition-all duration-200`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            {!collapsed && (
              <Link to="/dashboard" className="focus-visible:outline-none">
                <Logo variant="dark" size="sm" subtitle="Admin Console" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((p) => !p)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`w-9 h-9 rounded-card bg-gray-900 hover:bg-gray-600/30 text-gray-300 hover:text-brand-yellow flex items-center justify-center transition-colors cursor-pointer ${
                collapsed ? 'mx-auto' : ''
              }`}
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {renderLinks(collapsed)}
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-900">
          {!collapsed && (
            <div className="px-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Signed in as</div>
              <div className="text-ds-12 font-semibold text-brand-white truncate mt-0.5">
                {user?.email || 'Admin'}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className={`w-full flex items-center gap-2.5 min-h-[44px] px-3.5 py-2.5 rounded-card font-semibold text-ds-12 text-rose-400 hover:bg-rose-500/15 transition-colors border border-rose-500/25 cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar with Breadcrumbs, Global Search, Bell, Avatar Menu */}
        <header className="sticky top-0 z-40 h-16 bg-brand-white/95 backdrop-blur-md border-b border-gray-200">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
            {/* Left: Mobile Menu Toggle + Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen((p) => !p)}
                aria-label="Toggle admin navigation"
                className="lg:hidden w-10 h-10 rounded-card bg-brand-ink text-brand-white flex items-center justify-center cursor-pointer"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-ds-12 font-semibold min-w-0">
                <Link to="/dashboard" className="text-gray-400 hover:text-brand-ink transition-colors hidden sm:inline">
                  Admin Console
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 hidden sm:inline shrink-0" />
                <span className="font-display font-bold text-ds-14 text-brand-ink truncate">
                  {currentSection}
                </span>
              </nav>
            </div>

            {/* Center/Right: Global Search + Alerts Bell + Avatar */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center relative w-64 lg:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search provider name, email, service..."
                  aria-label="Global admin search"
                  className="w-full h-10 pl-10 pr-4 rounded-pill bg-gray-100 focus:bg-brand-white border border-gray-200 focus:border-brand-ink text-ds-12 font-medium text-brand-ink placeholder:text-gray-400 outline-none transition-colors"
                />
              </form>

              <button
                type="button"
                onClick={() => setAlertsOpen(true)}
                aria-label="Pending admin alerts"
                className="relative w-10 h-10 rounded-pill bg-gray-100 hover:bg-brand-yellowSoft border border-gray-200 flex items-center justify-center text-brand-ink transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" strokeWidth={2.2} />
                {pendingCount > 0 && (
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-status-danger ring-2 ring-brand-white" />
                )}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAvatarOpen((p) => !p)}
                  aria-label="Admin profile menu"
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-pill border border-gray-200 bg-brand-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Avatar name={user?.name || user?.email || 'Admin'} size="sm" tone="ink" />
                  <span className="hidden sm:inline text-ds-12 font-bold text-brand-ink max-w-[110px] truncate">
                    {user?.name?.split(' ')[0] || 'Admin'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:inline" />
                </button>

                {avatarOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 mt-2 w-56 bg-brand-white rounded-sheet border border-gray-200 shadow-sheet py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Administrator</div>
                        <div className="font-display font-bold text-ds-14 text-brand-ink truncate mt-0.5">
                          {user?.name || 'Admin'}
                        </div>
                        <div className="text-ds-12 text-gray-600 truncate">{user?.email}</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-ds-14 font-semibold text-status-danger hover:bg-rose-50 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Drawer Nav */}
        {mobileOpen && (
          <div className="lg:hidden bg-brand-ink text-brand-white p-4 border-b border-gray-900 space-y-4">
            {renderLinks(false, () => setMobileOpen(false))}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-card text-ds-12 font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/15"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Attention / Pending Queue Drawer */}
      <BottomSheet
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        title="Attention Queue"
        subtitle={`${pendingCount} provider verification request(s) awaiting review`}
        desktopPresentation="drawer"
        footer={
          <Button
            variant="accent"
            fullWidth
            onClick={() => {
              setAlertsOpen(false);
              navigate('/providers?status=PENDING');
            }}
          >
            Open Verification Queue
          </Button>
        }
      >
        {pendingAlerts.length === 0 ? (
          <div className="py-10 text-center text-ds-14 text-gray-600">
            All provider applications are up to date.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAlerts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setAlertsOpen(false);
                  navigate('/providers?status=PENDING');
                }}
                className="w-full text-left p-4 rounded-card bg-brand-yellowSoft/50 border border-brand-yellow hover:bg-brand-yellowSoft transition-colors flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="font-display font-bold text-ds-14 text-brand-ink truncate">{p.name}</div>
                  <div className="text-ds-12 text-gray-600 truncate">{p.email}</div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-brand-ink text-brand-yellow text-[11px] font-bold shrink-0">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              </button>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
