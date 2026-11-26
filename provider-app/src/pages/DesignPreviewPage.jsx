import React, { useState } from 'react';
import {
  MapPin, Search, Wrench, Zap, Droplet, Phone, Heart, Bell,
  Home, Calendar, User, LayoutDashboard, ShieldCheck, Users, Star, ArrowRight, Navigation
} from 'lucide-react';
import {
  Logo, Button, IconButton, Input, PasswordInput, OtpInput, Select,
  Chip, Badge, StatusBadge, Card, CardHeader, CardContent, CardFooter,
  Avatar, RatingStars, BottomSheet, Modal, ConfirmDialog, showToast,
  Skeleton, SkeletonCard, EmptyState, ErrorState, Stepper, Tabs,
  Toggle, PageHeader, BottomNav, Sidebar
} from '../components/ui';

export const DesignPreviewPage = () => {
  const [chipSelected, setChipSelected] = useState('electrician');
  const [activeTab, setActiveTab] = useState('active');
  const [underlineTab, setUnderlineTab] = useState('overview');
  const [toggleDuty, setToggleDuty] = useState(true);
  const [starVal, setStarVal] = useState(4);
  const [otpVal, setOtpVal] = useState('482');
  const [selectVal, setSelectVal] = useState('electrician');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [mobileNavKey, setMobileNavKey] = useState('home');
  const [sidebarKey, setSidebarKey] = useState('providers');
  const [timelineStatus, setTimelineStatus] = useState('ARRIVED');

  const brandSwatches = [
    { name: 'LocalGo Yellow', hex: '#FFC700', cls: 'bg-brand-yellow text-brand-ink' },
    { name: 'Ink Black', hex: '#0B0B0F', cls: 'bg-brand-ink text-brand-white' },
    { name: 'Pure White', hex: '#FFFFFF', cls: 'bg-brand-white text-brand-ink border border-gray-200' },
  ];

  const neutralSwatches = [
    { name: 'gray-50', hex: '#F7F7F8', cls: 'bg-gray-50 text-brand-ink border border-gray-200' },
    { name: 'gray-100', hex: '#EEEEF0', cls: 'bg-gray-100 text-brand-ink' },
    { name: 'gray-200', hex: '#E0E0E4', cls: 'bg-gray-200 text-brand-ink' },
    { name: 'gray-400', hex: '#9A9AA5', cls: 'bg-gray-400 text-brand-white' },
    { name: 'gray-600', hex: '#5B5B66', cls: 'bg-gray-600 text-brand-white' },
    { name: 'gray-900', hex: '#17171C', cls: 'bg-gray-900 text-brand-white' },
  ];

  const bookingStatuses = [
    'REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED',
    'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-ink text-brand-ink dark:text-brand-white pb-24">
      <div className="bg-brand-ink text-brand-white border-b border-gray-900 px-4 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Logo variant="dark" size="lg" subtitle="Design System Preview • Step 1" />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">v1.0 Ride-Hailing UI Kit</Badge>
            <Badge tone="success" dot>48px Min Touch Target</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        <PageHeader
          eyebrow="Step 1 Token & Component Audit"
          title="LocalGo Visual System"
          subtitle="Shared design tokens, touch-first controls, bottom sheets, and booking status components across all three portals."
          onBack={() => window.history.back()}
          actions={
            <>
              <Button variant="accent" onClick={() => setSheetOpen(true)} leftIcon={<Navigation className="w-5 h-5" />}>
                Open Bottom Sheet
              </Button>
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                Open Modal
              </Button>
            </>
          }
        />

        {/* 1. Brand, Logos & Colors */}
        <section className="space-y-4">
          <h2 className="text-ds-20 font-bold">1. Brand Identity, Wordmark & Color Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <span className="text-ds-12 font-bold uppercase tracking-wider text-gray-600">Wordmark Variants</span>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-6">
                <div className="p-3 bg-brand-white rounded-card border border-gray-200">
                  <Logo variant="light" size="md" subtitle="Customer App" />
                </div>
                <div className="p-3 bg-brand-ink rounded-card border border-gray-900">
                  <Logo variant="dark" size="md" subtitle="Provider Studio" />
                </div>
                <div className="p-2.5 bg-brand-white rounded-card border border-gray-200">
                  <Logo variant="light" size="sm" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <span className="text-ds-12 font-bold uppercase tracking-wider text-gray-600">Core Brand Palette</span>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                {brandSwatches.map((s) => (
                  <div key={s.name} className={`p-3 rounded-card ${s.cls}`}>
                    <div className="text-ds-12 font-bold">{s.name}</div>
                    <div className="text-[11px] opacity-80 font-mono mt-1">{s.hex}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <span className="text-ds-12 font-bold uppercase tracking-wider text-gray-600">Neutrals & Semantic Status Tokens</span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {neutralSwatches.map((s) => (
                  <div key={s.name} className={`p-3 rounded-card ${s.cls}`}>
                    <div className="text-ds-12 font-bold">{s.name}</div>
                    <div className="text-[11px] opacity-80 font-mono">{s.hex}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-card bg-status-success text-brand-white font-semibold text-ds-12">Success #12B76A</div>
                <div className="p-3 rounded-card bg-status-warning text-brand-ink font-semibold text-ds-12">Warning #F79009</div>
                <div className="p-3 rounded-card bg-status-danger text-brand-white font-semibold text-ds-12">Danger #F04438</div>
                <div className="p-3 rounded-card bg-status-info text-brand-white font-semibold text-ds-12">Info #2E90FA</div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 2. Typography Scale */}
        <section className="space-y-4">
          <h2 className="text-ds-20 font-bold">2. Typography Scale (12 / 14 / 16 / 20 / 24 / 32 / 40)</h2>
          <Card className="space-y-2.5">
            <div className="text-ds-40 font-bold">40px Display Hero — Doorstep Pros in Minutes</div>
            <div className="text-ds-32 font-bold">32px Section Heading — Active Service Requests</div>
            <div className="text-ds-24 font-bold">24px Page Title — Nearby Verified Technicians</div>
            <div className="text-ds-20 font-bold">20px Card Heading — Rajesh Kumar • Master Electrician</div>
            <div className="text-ds-16 font-semibold">16px Body Lead — Live arrival tracking enabled</div>
            <div className="text-ds-14 font-normal text-gray-600">14px Body Standard — Share your 4-digit OTP only after arrival.</div>
            <div className="text-ds-12 font-semibold text-gray-600">12px Caption / Metadata — 1.4 km away • 15 km coverage</div>
          </Card>
        </section>

        {/* 3. Buttons & IconButtons */}
        <section className="space-y-4">
          <h2 className="text-ds-20 font-bold">3. Buttons & Touch Controls (Min 48px Height)</h2>
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>Primary Black</Button>
              <Button variant="accent" leftIcon={<Zap className="w-5 h-5" />}>Accent Yellow</Button>
              <Button variant="secondary" leftIcon={<Phone className="w-5 h-5" />}>Secondary White</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>Danger / Cancel</Button>
              <Button
                variant="primary"
                loading={loadingBtn}
                onClick={() => {
                  setLoadingBtn(true);
                  setTimeout(() => setLoadingBtn(false), 1200);
                }}
              >
                {loadingBtn ? 'Loading...' : 'Trigger Loading'}
              </Button>
              <Button variant="accent" disabled>Disabled State</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
              <IconButton icon={<MapPin className="w-5 h-5" />} label="Locate" variant="accent" rounded="pill" />
              <IconButton icon={<Phone className="w-5 h-5" />} label="Call" variant="primary" />
              <IconButton icon={<Heart className="w-5 h-5" />} label="Favorite" variant="secondary" rounded="pill" />
              <IconButton icon={<Bell className="w-5 h-5" />} label="Alerts" variant="ghost" />
              <IconButton icon={<Wrench className="w-5 h-5" />} label="Loading action" loading variant="secondary" />
            </div>
          </Card>
        </section>

        {/* 4. Form Inputs, Select, OtpInput & Toggle */}
        <section className="space-y-4">
          <h2 className="text-ds-20 font-bold">4. Inputs, OTP Verification & Toggles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="space-y-4">
              <Input
                label="Search Location or Service"
                placeholder="Indiranagar, Bengaluru..."
                leftIcon={<Search className="w-5 h-5" />}
                helperText="Uses GPS or manual neighborhood selection"
              />
              <Input
                label="Address Line (Error Example)"
                defaultValue="Apt"
                error="Please enter your complete house number and street."
              />
              <PasswordInput label="Account Password" defaultValue="SuperSecret123" />
              <Select
                label="Service Category"
                value={selectVal}
                onChange={(e) => setSelectVal(e.target.value)}
                options={[
                  { value: 'electrician', label: 'Electrician (₹249+)' },
                  { value: 'plumber', label: 'Plumber (₹199+)' },
                  { value: 'ac-repair', label: 'AC Repair & Service (₹499+)' },
                ]}
              />
            </Card>

            <Card className="space-y-5">
              <div>
                <div className="text-ds-12 font-bold text-gray-900 mb-2">6-Digit OTP Input (Paste & Auto-Advance)</div>
                <OtpInput
                  value={otpVal}
                  onChange={setOtpVal}
                  onComplete={(code) => showToast.success(`Entered OTP: ${code}`)}
                  onResend={() => showToast.info('Resent verification OTP')}
                  cooldownSeconds={30}
                />
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <Toggle
                  checked={toggleDuty}
                  onChange={(next) => {
                    setToggleDuty(next);
                    showToast.info(next ? 'Provider switched Online' : 'Provider switched Offline');
                  }}
                  label="Go Online for Dispatch"
                  description="Receive real-time nearby booking alerts when active"
                  tone="success"
                />
              </div>
            </Card>
          </div>
        </section>

        {/* 5. Chips, Badges, Avatars, RatingStars & Tabs */}
        <section className="space-y-4">
          <h2 className="text-ds-20 font-bold">5. Chips, Status Badges, Avatars, Ratings & Tabs</h2>
          <Card className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'electrician', label: 'Electrician', icon: <Zap className="w-4 h-4" /> },
                { key: 'plumber', label: 'Plumber', icon: <Droplet className="w-4 h-4" /> },
                { key: 'ac-repair', label: 'AC Service', icon: <Wrench className="w-4 h-4" /> },
              ].map((c) => (
                <Chip
                  key={c.key}
                  selected={chipSelected === c.key}
                  tone="yellow"
                  leftIcon={c.icon}
                  count={4}
                  onClick={() => setChipSelected(c.key)}
                >
                  {c.label}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
              {bookingStatuses.map((st) => (
                <StatusBadge key={st} status={st} />
              ))}
              <StatusBadge status="ONLINE" />
              <StatusBadge status="OFFLINE" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <Avatar name="Rajesh Kumar" size="sm" tone="yellow" />
                <Avatar name="Praveen Reddy" size="md" status="online" verified />
                <Avatar name="Anitha Devi" size="lg" status="offline" verified />
              </div>

              <div className="space-y-2">
                <RatingStars rating={4.8} showValue reviewCount={142} />
                <RatingStars rating={starVal} interactive onChange={setStarVal} />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100">
              <Tabs
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { key: 'active', label: 'Active Jobs', count: 2 },
                  { key: 'pending', label: 'Requests', count: 5 },
                  { key: 'history', label: 'History' },
                ]}
              />
              <Tabs
                variant="underline"
                activeTab={underlineTab}
                onChange={setUnderlineTab}
                tabs={[
                  { key: 'overview', label: 'Overview' },
                  { key: 'reviews', label: 'Customer Reviews', count: 28 },
                  { key: 'pricing', label: 'Rate Card' },
                ]}
              />
            </div>
          </Card>
        </section>

        {/* 6. Stepper, Toasts & States (Skeleton / Empty / Error) */}
        <section className="space-y-4">
          <h2 className="text-ds-20 font-bold">6. Animated Stepper, Toasts & Loading/Empty/Error States</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {['REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'].map((s) => (
                  <Chip key={s} selected={timelineStatus === s} onClick={() => setTimelineStatus(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
              <Stepper
                currentStatus={timelineStatus}
                reason={timelineStatus === 'EXPIRED' ? 'No provider accepted within 10 minutes.' : null}
                timestamps={{
                  createdAt: new Date(),
                  acceptedAt: new Date(),
                  onTheWayAt: new Date(),
                  arrivedAt: new Date(),
                }}
              />
            </div>

            <div className="space-y-4">
              <Card variant="dark">
                <CardHeader className="border-gray-900">
                  <span className="text-ds-12 font-bold uppercase tracking-wider text-brand-yellow">Styled Toast Notifications</span>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="accent" onClick={() => showToast.success('Booking accepted! Provider en route.')}>Success Toast</Button>
                  <Button variant="danger" onClick={() => showToast.error('Payment confirmation failed.')}>Error Toast</Button>
                  <Button variant="secondary" onClick={() => showToast.warning('Server waking up, retrying...')}>Warning Toast</Button>
                </CardContent>
                <CardFooter className="border-gray-900 text-ds-12 text-gray-400">
                  <span>High-contrast dark pill toasts match Uber/Rapido surface tokens.</span>
                </CardFooter>
              </Card>

              <SkeletonCard />
              <EmptyState
                title="No Saved Technicians"
                description="Tap the heart icon on any nearby professional to keep them pinned here."
                actionLabel="Browse Nearby"
                actionVariant="accent"
                onAction={() => showToast.info('Empty state CTA clicked')}
              />
              <ErrorState
                compact
                message="Render backend timed out while waking up."
                onRetry={() => showToast.success('Retry triggered!')}
              />
            </div>
          </div>
        </section>

        {/* 7. Navigation Primitives (Mobile BottomNav + Desktop Sidebar) */}
        <section className="space-y-4">
          <h2 className="text-ds-20 font-bold">7. Navigation Primitives (BottomNav & Admin Sidebar)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <Card className="space-y-3">
              <div className="text-ds-12 font-bold uppercase text-gray-600">Mobile BottomNav (390px target)</div>
              <div className="max-w-[390px] mx-auto border border-gray-200 rounded-sheet overflow-hidden bg-gray-100 pt-10">
                <BottomNav
                  fixed={false}
                  activeKey={mobileNavKey}
                  onSelect={setMobileNavKey}
                  items={[
                    { key: 'home', label: 'Home', icon: Home },
                    { key: 'search', label: 'Services', icon: Search },
                    { key: 'map', label: 'Map', icon: MapPin },
                    { key: 'bookings', label: 'Bookings', icon: Calendar, badge: 2 },
                    { key: 'profile', label: 'Account', icon: User },
                  ]}
                />
              </div>
            </Card>

            <Card padding="none" className="overflow-hidden">
              <div className="flex h-[360px]">
                <Sidebar
                  subtitle="Admin Ops"
                  activeKey={sidebarKey}
                  onSelect={setSidebarKey}
                  items={[
                    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { key: 'providers', label: 'Verification Queue', icon: ShieldCheck, badge: 4 },
                    { key: 'users', label: 'Users', icon: Users },
                    { key: 'reviews', label: 'Reviews', icon: Star },
                  ]}
                />
                <div className="flex-1 p-6 bg-gray-50 flex flex-col justify-center items-center text-center space-y-2">
                  <Badge tone="accent">Selected: {sidebarKey}</Badge>
                  <p className="text-ds-14 text-gray-600 max-w-xs">
                    Desktop-first dark sidebar paired with high-contrast #FFC700 active highlight.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>

      {/* Interactive Overlays */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Confirm Doorstep Booking"
        subtitle="Drag handle down or tap backdrop to dismiss"
        footer={
          <Button variant="accent" fullWidth onClick={() => { setSheetOpen(false); showToast.success('Booking confirmed!'); }}>
            Confirm Appointment • ₹249
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-card border border-gray-200">
            <Avatar name="Rajesh Kumar" status="online" verified />
            <div className="flex-1">
              <div className="font-bold text-ds-16">Rajesh Kumar</div>
              <div className="text-ds-12 text-gray-600">Master Electrician • 0.8 km away</div>
            </div>
            <StatusBadge status="ONLINE" />
          </div>
          <p className="text-ds-14 text-gray-600">
            Elevated 16px-radius bottom sheet built for thumb-friendly mobile booking flows.
          </p>
        </div>
      </BottomSheet>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Inspect Provider Profile"
        subtitle="Modal dialog component preview"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Close</Button>
            <Button variant="primary" onClick={() => { setModalOpen(false); showToast.success('Approved!'); }}>Approve</Button>
          </>
        }
      >
        <p className="text-ds-14 text-gray-600">
          Centered modal dialog with Escape-key dismissal, backdrop blur, and accessible 48px action buttons.
        </p>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel Booking Request?"
        message="This will notify the technician immediately and release your reserved time slot."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Booking"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          showToast.error('Booking cancelled');
        }}
      />
    </div>
  );
};

export default DesignPreviewPage;
