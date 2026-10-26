// Loading skeletons shown instantly (Next.js loading.tsx) while a page renders on the server.
// Pure server components, no JS: shapes mirror the real pages so the layout does not jump when content arrives.
const pulse = "motion-safe:animate-pulse";
export const Bar = ({ w = "w-full", h = "h-4", className = "" }: { w?: string; h?: string; className?: string }) => <div className={`${h} ${w} rounded-lg bg-line ${className}`} />;
const Block = ({ className = "" }: { className?: string }) => <div className={`rounded-2xl bg-line/60 ${className}`} />;
const Shell = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div role="status" aria-busy="true" aria-live="polite" className={`${pulse} ${className}`}><span className="sr-only">{label}</span>{children}</div>);

export function HomePage() { return (<Shell label="Loading" className="mx-auto max-w-6xl px-6 py-16 space-y-6"><Bar w="w-2/3" h="h-12" /><Bar w="w-1/2" h="h-12" /><Bar w="w-1/3" />
  <div className="flex gap-3 pt-4"><Block className="h-14 flex-1 max-w-md" /><Block className="h-14 w-28" /></div><Block className="mt-10 h-72" /></Shell>); }
export function ArticlePage() { return (<Shell label="Loading page" className="mx-auto my-16 max-w-3xl rounded-3xl px-8 py-12 space-y-4"><Bar w="w-1/2" h="h-9" />
  {[100, 95, 90, 100, 70, 96, 85].map((w, i) => <div key={i} style={{ width: `${w}%` }} className={`h-4 rounded-lg bg-line ${i === 3 ? "mt-6" : ""}`} />)}<Bar w="w-1/3" h="h-6" className="mt-6" />{[92, 80, 60].map((w, i) => <div key={i} style={{ width: `${w}%` }} className="h-4 rounded-lg bg-line" />)}</Shell>); }
export function CardsPage({ n = 3 }: { n?: number }) { return (<Shell label="Loading" className="mx-auto max-w-6xl px-6 py-16 space-y-8"><div className="mx-auto max-w-xl space-y-3"><Bar h="h-10" /><Bar w="w-3/4" className="mx-auto" /></div>
  <div className="grid gap-5 md:grid-cols-3">{Array.from({ length: n }, (_, i) => <Block key={i} className="h-72" />)}</div></Shell>); }
export const PricingPage = () => <CardsPage n={3} />;
export const FeaturesPage = () => <CardsPage n={6} />;
export function FormPage({ fields = 3 }: { fields?: number }) { return (<Shell label="Loading form" className="mx-auto my-16 w-full max-w-md rounded-3xl px-6 py-10 space-y-5"><Bar w="w-1/2" h="h-8" /><Bar w="w-3/4" />
  {Array.from({ length: fields }, (_, i) => <div key={i} className="space-y-2"><Bar w="w-24" h="h-3" /><Block className="h-12" /></div>)}<Block className="h-12" /></Shell>); }
export const ContactPage = () => <FormPage fields={4} />;
export function TrackPage() { return (<Shell label="Loading tracking details" className="mx-auto max-w-3xl px-6 py-12 space-y-6"><div className="space-y-2"><Bar w="w-40" h="h-3" /><Bar w="w-2/3" h="h-9" /></div>
  <Block className="h-24" />{Array.from({ length: 4 }, (_, i) => <div key={i} className="flex gap-4"><div className="h-5 w-5 shrink-0 rounded-full bg-line" /><div className="flex-1 space-y-2"><Bar w="w-1/2" /><Bar w="w-1/3" h="h-3" /></div></div>)}</Shell>); }
export function SellerWorkspace() { return (<Shell label="Loading your workspace" className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8 sm:px-6"><Bar w="w-1/4" h="h-9" />
  <div className="flex gap-2 overflow-hidden">{Array.from({ length: 6 }, (_, i) => <Block key={i} className="h-9 w-24 shrink-0 rounded-xl" />)}</div>
  <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Block key={i} className="h-28" />)}</div><Block className="h-64" /></Shell>); }
export function AdminTable({ rows = 8 }: { rows?: number }) { return (<Shell label="Loading" className="p-4 md:p-8 space-y-5"><Bar w="w-48" h="h-8" /><div className="flex gap-3"><Block className="h-10 w-56 rounded-xl" /><Block className="h-10 w-28 rounded-xl" /></div>
  <div className="space-y-2">{Array.from({ length: rows }, (_, i) => <Block key={i} className="h-12 rounded-xl" />)}</div></Shell>); }
export function AdminDashboard() { return (<Shell label="Loading dashboard" className="p-4 md:p-8 space-y-6"><Bar w="w-56" h="h-8" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Block key={i} className="h-28" />)}</div>
  <div className="grid gap-4 lg:grid-cols-2"><Block className="h-64" /><Block className="h-64" /></div></Shell>); }
export function AdminDetail() { return (<Shell label="Loading details" className="p-4 md:p-8 space-y-5"><Bar w="w-1/3" h="h-8" /><div className="grid gap-4 md:grid-cols-3"><Block className="h-40 md:col-span-2" /><Block className="h-40" /></div><Block className="h-64" /></Shell>); }
