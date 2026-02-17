import { useState, useEffect, useCallback } from "react"
import {
  Package, DollarSign, Users, TrendingUp, TrendingDown,
  ShoppingBag, RefreshCw, AlertCircle, Tag, Layers
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

const API_URL = import.meta.env.VITE_API_URL

// ─── Status badge (same palette as OrdersPage) ───────────────────────────────
const STATUS_COLORS = {
  pending:    "bg-yellow-500",
  confirmed:  "bg-blue-500",
  processing: "bg-purple-500",
  shipped:    "bg-indigo-500",
  delivered:  "bg-green-500",
  cancelled:  "bg-red-500",
}

// ─── KPI card — mirrors the motion cards in OrdersPage stats ─────────────────
function KpiCard({ label, value, sub, change, icon: Icon, iconColor, delay = 0 }) {
  const positive = change === undefined || change >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? "text-green-500" : "text-red-500"}`}>
          {positive
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />}
          <span>{Math.abs(change)}% vs last month</span>
        </div>
      )}
    </motion.div>
  )
}

// ─── Section heading (same as h1 style in OrdersPage) ────────────────────────
function SectionHeading({ children }) {
  return <h2 className="text-lg font-semibold text-foreground mb-4">{children}</h2>
}

// ─── Order Pipeline bars ──────────────────────────────────────────────────────
function OrderPipeline({ counts }) {
  const statuses = [
    { key: "pending",    label: "Pending",    color: "bg-yellow-500" },
    { key: "confirmed",  label: "Confirmed",  color: "bg-blue-500" },
    { key: "processing", label: "Processing", color: "bg-purple-500" },
    { key: "shipped",    label: "Shipped",    color: "bg-indigo-500" },
    { key: "delivered",  label: "Delivered",  color: "bg-green-500" },
    { key: "cancelled",  label: "Cancelled",  color: "bg-red-500" },
  ]
  const max = Math.max(...statuses.map(s => counts[s.key] || 0), 1)
  return (
    <div className="space-y-3">
      {statuses.map(s => (
        <div key={s.key} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{s.label}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((counts[s.key] || 0) / max) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${s.color}`}
            />
          </div>
          <span className="text-xs font-medium text-foreground w-8 text-right">
            {counts[s.key] || 0}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Gender donut ─────────────────────────────────────────────────────────────
const GENDER_COLORS = ["#f472b6", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa"]

function GenderDonut({ data }) {
  const [hovered, setHovered] = useState(null)
  const r = 36, cx = 48, cy = 48
  let offset = 0
  const slices = data.map((g, i) => {
    const pct = g.percentage
    const dashArray = (pct / 100) * 2 * Math.PI * r
    const dashOffset = -(offset / 100) * 2 * Math.PI * r
    offset += pct
    return { ...g, dashArray, dashOffset, color: GENDER_COLORS[i % GENDER_COLORS.length] }
  })

  return (
    <div className="flex items-center gap-6">
      <svg width="96" height="96" viewBox="0 0 96 96" className="flex-shrink-0">
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={hovered === i ? 10 : 7}
            strokeDasharray={`${s.dashArray} ${2 * Math.PI * r}`}
            strokeDashoffset={s.dashOffset}
            style={{ transition: "stroke-width 0.2s", cursor: "pointer", opacity: hovered !== null && hovered !== i ? 0.3 : 1 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            transform="rotate(-90 48 48)"
          />
        ))}
        <text x="48" y="44" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold">
          {hovered !== null ? `${slices[hovered]?.percentage}%` : ""}
        </text>
        <text x="48" y="58" textAnchor="middle" fill="#6b7280" fontSize="7">
          {hovered !== null ? slices[hovered]?.gender : "hover"}
        </text>
      </svg>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 cursor-pointer text-sm"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-muted-foreground truncate">{s.gender}</span>
            <span className="ml-auto font-medium text-foreground">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Top products table ───────────────────────────────────────────────────────
function TopProductsTable({ products }) {
  const maxSales = Math.max(...products.map(p => p.sales_count), 1)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {["#", "Product", "Type", "Sales", "Revenue", "Stock"].map(h => (
              <th key={h} className="pb-3 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <motion.tr key={p.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-border hover:bg-muted/30 transition-colors"
            >
              <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">{i + 1}</td>
              <td className="py-3 pr-4 font-medium text-foreground max-w-[180px] truncate">{p.title}</td>
              <td className="py-3 pr-4">
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{p.product_type}</span>
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full"
                      style={{ width: `${(p.sales_count / maxSales) * 100}%` }} />
                  </div>
                  <span className="font-mono text-xs text-foreground">{p.sales_count}</span>
                </div>
              </td>
              <td className="py-3 pr-4 font-mono text-green-500 text-xs">${p.revenue.toLocaleString()}</td>
              <td className="py-3">
                <span className={`text-xs font-medium ${p.in_stock ? "text-green-500" : "text-red-500"}`}>
                  {p.in_stock ? "● In Stock" : "○ Out"}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Recent orders table — mirrors the card+table in OrdersPage ───────────────
function RecentOrdersTable({ orders }) {
  const formatDate = (ds) => {
    if (!ds) return "—"
    const d = new Date(ds)
    const diff = Date.now() - d.getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return "Just now"
    if (h < 24) return `${h}h ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {["Order", "Customer", "City", "Items", "Total", "Status", "When"].map(h => (
              <th key={h} className="pb-3 pr-6 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <motion.tr key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="border-b border-border hover:bg-muted/30 transition-colors"
            >
              <td className="py-3 pr-6 font-mono text-xs text-primary">#{o.order_number}</td>
              <td className="py-3 pr-6 font-medium text-foreground">{o.customer_name}</td>
              <td className="py-3 pr-6 text-muted-foreground">{o.city}</td>
              <td className="py-3 pr-6 text-muted-foreground">{o.item_count} item{o.item_count !== 1 ? "s" : ""}</td>
              <td className="py-3 pr-6 font-mono text-foreground">${o.total.toFixed(2)}</td>
              <td className="py-3 pr-6">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-white ${STATUS_COLORS[o.status] || "bg-gray-500"}`}>
                  {o.status}
                </span>
              </td>
              <td className="py-3 text-muted-foreground text-xs">{formatDate(o.created_at)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats]           = useState(null)
  const [chart, setChart]           = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [genderData, setGenderData] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const token = localStorage.getItem("admin_token")
  const headers = { Authorization: `Bearer ${token}` }

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError("")

    try {
      const [statsRes, chartRes, topRes, genderRes, recentRes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard/stats`,           { headers }),
        fetch(`${API_URL}/admin/dashboard/revenue-chart`,   { headers }),
        fetch(`${API_URL}/admin/dashboard/top-products`,    { headers }),
        fetch(`${API_URL}/admin/dashboard/gender-breakdown`,{ headers }),
        fetch(`${API_URL}/admin/dashboard/recent-orders`,   { headers }),
      ])

      if (!statsRes.ok) throw new Error("Failed to load dashboard stats")

      const [s, c, t, g, r] = await Promise.all([
        statsRes.json(), chartRes.json(), topRes.json(),
        genderRes.json(), recentRes.json(),
      ])

      setStats(s)
      setChart(c.chart || [])
      setTopProducts(t.top_products || [])
      setGenderData(g.breakdown || [])
      setRecentOrders(r.recent_orders || [])
    } catch (err) {
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-24">
          <RefreshCw className="w-10 h-10 mx-auto text-muted-foreground animate-spin mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Store overview &amp; key metrics</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Alert className="mb-6 bg-destructive/10 border-destructive/50">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {stats && (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              label="Total Revenue"
              value={`$${Number(stats.revenue.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub={`$${Number(stats.revenue.today).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} today`}
              change={stats.revenue.change_pct}
              icon={DollarSign}
              iconColor="text-green-500"
              delay={0}
            />
            <KpiCard
              label="Total Orders"
              value={stats.orders.total.toLocaleString()}
              sub={`${stats.orders.today} today · ${stats.orders.pending} pending`}
              change={stats.orders.change_pct}
              icon={Package}
              iconColor="text-primary"
              delay={0.1}
            />
            <KpiCard
              label="Products"
              value={stats.products.total.toLocaleString()}
              sub={`${stats.products.in_stock} in stock · ${stats.products.new_arrivals} new`}
              icon={ShoppingBag}
              iconColor="text-violet-500"
              delay={0.2} change={undefined}            />
            <KpiCard
              label="Customers"
              value={stats.customers.total.toLocaleString()}
              sub="Unique by phone"
              change={stats.customers.change_pct}
              icon={Users}
              iconColor="text-blue-500"
              delay={0.3}
            />
          </div>

          {/* ── Revenue Chart + Gender Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <SectionHeading>Revenue Trend</SectionHeading>
                  <p className="text-xs text-muted-foreground -mt-3">Last 12 months</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">
                    ${Number(stats.revenue.this_month).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">this month</p>
                </div>
              </div>
              {chart.length > 0 && (
                <>
                  {/* Bar chart */}
                  <div className="flex items-end gap-1 h-24 mb-2">
                    {chart.map((m, i) => {
                      const maxRev = Math.max(...chart.map(c => c.revenue), 1)
                      const heightPct = (m.revenue / maxRev) * 100
                      const isLast = i === chart.length - 1
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            ${m.revenue.toLocaleString()}
                          </div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ delay: i * 0.04, duration: 0.4, ease: "easeOut" }}
                            className={`w-full rounded-t cursor-pointer ${isLast ? "bg-primary" : "bg-muted-foreground/30 group-hover:bg-primary/60"} transition-colors`}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between">
                    {chart.map((m, i) => (
                      <span key={i} className="text-muted-foreground flex-1 text-center" style={{ fontSize: "9px" }}>{m.month}</span>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* Gender Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <SectionHeading>Sales by Gender</SectionHeading>
              {genderData.length > 0
                ? <GenderDonut data={genderData} />
                : <p className="text-sm text-muted-foreground">No data yet</p>
              }
            </motion.div>
          </div>

          {/* ── Top Products + Order Pipeline ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-card border border-border rounded-lg p-4"
            >
              <SectionHeading>Top Performing Products</SectionHeading>
              {topProducts.length > 0
                ? <TopProductsTable products={topProducts} />
                : <p className="text-sm text-muted-foreground">No products yet</p>
              }
            </motion.div>

            {/* Right column: Order Pipeline + Inventory Health */}
            <div className="flex flex-col gap-4">

              {/* Order Pipeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-card border border-border rounded-lg p-4"
              >
                <SectionHeading>Order Pipeline</SectionHeading>
                <OrderPipeline counts={stats.orders.status_counts} />
              </motion.div>

              {/* Inventory Health */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-lg p-4"
              >
                <SectionHeading>Inventory Health</SectionHeading>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">In Stock</span>
                      <span className="text-green-500 font-medium">{stats.products.in_stock} / {stats.products.total}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.products.in_stock / (stats.products.total || 1)) * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full bg-green-500 rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Out of Stock</span>
                      <span className="text-red-500 font-medium">{stats.products.out_of_stock} / {stats.products.total}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.products.out_of_stock / (stats.products.total || 1)) * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full bg-red-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-orange-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">On Sale</p>
                        <p className="font-bold text-foreground text-sm">{stats.products.on_sale}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-violet-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">New Arrivals</p>
                        <p className="font-bold text-foreground text-sm">{stats.products.new_arrivals}</p>
                      </div>
                    </div>
                  </div>

                  {stats.products.critical_stock?.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Critical — Out of Stock</p>
                      {stats.products.critical_stock.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">{p.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── Recent Orders ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <SectionHeading>Recent Orders</SectionHeading>
              <span className="text-xs text-muted-foreground">Last 10</span>
            </div>
            {recentOrders.length > 0
              ? <RecentOrdersTable orders={recentOrders} />
              : <p className="text-sm text-muted-foreground">No orders yet</p>
            }
          </motion.div>
        </>
      )}
    </div>
  )
}