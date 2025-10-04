"use client"

import { useState, useEffect } from "react"
import { ShoppingBag, ShoppingCart, TrendingUp, DollarSign, AlertCircle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"

const API_URL = import.meta.env.VITE_API_URL

interface Stats {
  total_revenue: string
  total_orders: number
  pending_orders: number
  total_products: number
  out_of_stock: number
  monthly_revenue: string
  monthly_orders: number
}

interface BestSeller {
  product_id: number
  title: string
  image?: string
  total_sold: number
  total_revenue: string
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  total: string
  status: string
}

export default function DashboardContent() {
  const [stats, setStats] = useState<Stats>({
    total_revenue: "0",
    total_orders: 0,
    pending_orders: 0,
    total_products: 0,
    out_of_stock: 0,
    monthly_revenue: "0",
    monthly_orders: 0,
  })
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("admin_token")

    try {
      const [statsRes, sellersRes, ordersRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/best-sellers?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/orders?per_page=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (statsRes.ok) {
        setStats(await statsRes.json())
      }

      if (sellersRes.ok) {
        const data = await sellersRes.json()
        setBestSellers(Array.isArray(data) ? data : [])
      } else {
        setBestSellers([])
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setRecentOrders(data.orders || [])
      } else {
        setRecentOrders([])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch dashboard data:", error)
      setBestSellers([])
      setRecentOrders([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const statCards = [
    {
      icon: DollarSign,
      label: "Total Revenue",
      value: `$${stats.total_revenue}`,
      subtitle: `$${stats.monthly_revenue} this month`,
      badge: "This Month",
      bgColor: "bg-muted",
      iconColor: "text-foreground",
    },
    {
      icon: ShoppingCart,
      label: "Total Orders",
      value: stats.total_orders,
      subtitle: `${stats.monthly_orders} this month`,
      badge: "All Time",
      bgColor: "bg-muted",
      iconColor: "text-foreground",
    },
    {
      icon: Clock,
      label: "Pending Orders",
      value: stats.pending_orders,
      subtitle: "Requires attention",
      badge: stats.pending_orders > 0 ? "Action Needed" : undefined,
      bgColor: "bg-muted",
      iconColor: "text-foreground",
    },
    {
      icon: ShoppingBag,
      label: "Total Products",
      value: stats.total_products,
      subtitle: `${stats.out_of_stock} out of stock`,
      badge: stats.out_of_stock > 0 ? `${stats.out_of_stock} Out` : undefined,
      bgColor: "bg-muted",
      iconColor: "text-foreground",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Quick overview of your store</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-card rounded-lg border border-border p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                {stat.badge && (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                    {stat.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-2">{stat.subtitle}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Best Sellers & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-lg border border-border p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-bold text-foreground">Best Sellers</h3>
          </div>

          {bestSellers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-4">
              {bestSellers.map((item) => (
                <motion.div key={item.product_id} whileHover={{ x: 4 }} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.total_sold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">${item.total_revenue}</p>
                    <p className="text-xs text-muted-foreground">revenue</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-lg border border-border p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <ShoppingCart className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-bold text-foreground">Recent Orders</h3>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <motion.div
                  key={order.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">${order.total}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === "pending"
                          ? "bg-orange-500/10 text-orange-700"
                          : order.status === "delivered"
                            ? "bg-green-500/10 text-green-700"
                            : "bg-blue-500/10 text-blue-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Alert */}
      {(stats.pending_orders > 0 || stats.out_of_stock > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Alert className="bg-destructive/10 border-destructive/50">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <AlertDescription className="text-foreground ml-2">
              <p className="font-medium">Attention Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.pending_orders > 0 && `You have ${stats.pending_orders} pending order(s). `}
                {stats.out_of_stock > 0 && `${stats.out_of_stock} product(s) are out of stock.`}
              </p>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  )
}
