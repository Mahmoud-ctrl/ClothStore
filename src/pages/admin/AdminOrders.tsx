import { useState, useEffect } from "react"
import { Package, Phone, Truck, X, MapPin, DollarSign, Calendar, Filter, Search, BellOff, Bell, RefreshCw  } from "lucide-react"
import { FaWhatsapp } from "react-icons/fa"; 
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"

const API_URL = import.meta.env.VITE_API_URL

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
  { value: 'processing', label: 'Processing', color: 'bg-purple-500' },
  { value: 'shipped', label: 'Shipped', color: 'bg-indigo-500' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' }
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'paid', label: 'Paid', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'refunded', label: 'Refunded', color: 'bg-gray-500' }
]

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deliveryPhone, setDeliveryPhone] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [pollingEnabled, setPollingEnabled] = useState(true)
  
  const token = localStorage.getItem("admin_token")

  // Notification sound
  const playNotification = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eifTRAMUKfj8LZjHAY4ktjxz3oqBSN3yPDej0EKFF+z6OunVRQKRp/g8r5sIQYtgs/y2Yk2Bxdpu+3nn00RDFCn4/C1ZBwGOJLY8c96KgUid8jv3o9BCRVftOjrp1UUCkSf4PK+bCEGLYLP8dmJNgcYabzt559NEQxPpuPwtmQcBjiS2PHP')
    audio.volume = 0.5
    audio.play().catch(() => console.log('Could not play notification sound'))
  }

  // Polling for new orders
  useEffect(() => {
    if (!pollingEnabled) return

    const interval = setInterval(() => {
      fetchOrdersSilently()
    }, 8000) // Poll every 8 seconds

    return () => clearInterval(interval)
  }, [pollingEnabled, statusFilter, searchTerm, lastOrderCount])

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [statusFilter, searchTerm])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      const res = await fetch(`${API_URL}/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const newOrders = data.orders || []
      
      // Check for new orders
      if (lastOrderCount > 0 && newOrders.length > lastOrderCount) {
        playNotification()
        // Show temporary notification
        const newOrdersCount = newOrders.length - lastOrderCount
        setError(`🔔 ${newOrdersCount} new order${newOrdersCount > 1 ? 's' : ''} received!`)
        setTimeout(() => setError(""), 5000)
      }
      
      setOrders(newOrders)
      setLastOrderCount(newOrders.length)
    } catch (err) {
      setError("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const fetchOrdersSilently = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      const res = await fetch(`${API_URL}/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const newOrders = data.orders || []
      
      // Check for new orders
      if (newOrders.length > lastOrderCount) {
        playNotification()
        fetchStats() // Update stats when new orders arrive
        const newOrdersCount = newOrders.length - lastOrderCount
        setError(`🔔 ${newOrdersCount} new order${newOrdersCount > 1 ? 's' : ''} received!`)
        setTimeout(() => setError(""), 5000)
      }
      
      setOrders(newOrders)
      setLastOrderCount(newOrders.length)
    } catch (err) {
      console.error('Polling error:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/orders/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error("Failed to load stats")
    }
  }

  const fetchOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setSelectedOrder(data)
      setShowModal(true)
    } catch (err) {
      setError("Failed to load order details")
    }
  }

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (res.ok) {
        fetchOrders()
        if (selectedOrder?.id === orderId) {
          fetchOrderDetails(orderId)
        }
      }
    } catch (err) {
      setError("Failed to update status")
    }
  }

  const updatePaymentStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/admin/orders/${orderId}/payment-status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_status: newStatus })
      })
      
      if (res.ok) {
        fetchOrders()
        if (selectedOrder?.id === orderId) {
          fetchOrderDetails(orderId)
        }
      }
    } catch (err) {
      setError("Failed to update payment status")
    }
  }

  const contactCustomer = (phone, orderNumber, customerName) => {
    const message = encodeURIComponent(
      `Hello ${customerName}, this is regarding your order #${orderNumber}. `
    )
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank')
  }

  const sendToDelivery = () => {
    if (!deliveryPhone || !selectedOrder) return
    
    const items = selectedOrder.items.map(item => 
      `• ${item.product_title} (${item.quantity}x)`
    ).join('\n')
    
    const message = encodeURIComponent(
      `🚚 NEW DELIVERY\n\n` +
      `📦 Order: #${selectedOrder.order_number}\n` +
      `👤 Customer: ${selectedOrder.customer_name}\n` +
      `📞 Phone: ${selectedOrder.customer_phone}\n` +
      `📍 Address: ${selectedOrder.address_line1}, ${selectedOrder.city}\n\n` +
      `🛍️ Items:\n${items}\n\n` +
      `💰 Total: $${selectedOrder.total}\n` +
      `💳 Payment: ${selectedOrder.payment_status.toUpperCase()}\n\n` +
      `${selectedOrder.latitude && selectedOrder.longitude ? 
        `📌 Location: https://maps.google.com/?q=${selectedOrder.latitude},${selectedOrder.longitude}` : 
        ''}`
    )
    
    window.open(`https://wa.me/${deliveryPhone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank')
    setDeliveryPhone("")
  }

  const getStatusColor = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-500'
  }

  const getPaymentColor = (status) => {
    return PAYMENT_STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-500'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Orders Management</h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <button
                    onClick={() => setPollingEnabled(!pollingEnabled)}
                    className="text-xs px-3 py-1 rounded border border-border hover:bg-muted transition-colors flex items-center gap-1"
                >
                    {pollingEnabled ? (
                    <>
                        <Bell className="h-4 w-4" /> Notifications ON
                    </>
                    ) : (
                    <>
                        <BellOff className="h-4 w-4" /> Notifications OFF
                    </>
                    )}
                </button>
                </p>
            </div>

            <button
                onClick={() => {
                fetchOrders();
                fetchStats();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors"
            >
                <RefreshCw className="h-4 w-4" /> Refresh Now
            </button>
            </div>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total_orders}</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">${stats.total_revenue}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.status_counts?.pending || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last 24h</p>
                  <p className="text-2xl font-bold text-foreground">{stats.recent_orders_24h}</p>
                </div>
                <Truck className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders, customer name, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-border"
              >
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={statusFilter === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("")}
                  >
                    All
                  </Button>
                  {STATUS_OPTIONS.map(status => (
                    <Button
                      key={status.value}
                      variant={statusFilter === status.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status.value)}
                      className="gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${status.color}`} />
                      {status.label}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert className={`mb-4 ${error.includes('🔔') ? 'bg-green-500/10 border-green-500/50' : 'bg-destructive/10 border-destructive/50'}`}>
              <AlertDescription className={error.includes('🔔') ? 'text-green-600 dark:text-green-400 font-medium' : 'text-destructive'}>
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className="bg-card border border-border rounded-lg p-4 cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => fetchOrderDetails(order.id)}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-foreground text-lg">#{order.order_number}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getPaymentColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{order.customer_name}</span>
                      • {order.customer_phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {order.city}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">${order.total}</p>
                  <p className="text-sm text-muted-foreground">{order.item_count} items</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      contactCustomer(order.customer_phone, order.order_number, order.customer_name)
                    }}
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    Contact
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {showModal && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowModal(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card rounded-lg max-w-3xl w-full p-6 pointer-events-auto border border-border max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      Order #{selectedOrder.order_number}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
                  <Button onClick={() => setShowModal(false)} variant="ghost" size="icon">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Customer Info */}
                <div className="bg-muted/20 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-foreground mb-3">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium text-foreground">{selectedOrder.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">{selectedOrder.customer_phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Delivery Address</p>
                      <p className="font-medium text-foreground">
                        {selectedOrder.address_line1}, {selectedOrder.city}
                      </p>
                      {selectedOrder.latitude && selectedOrder.longitude && (
                        <a
                          href={`https://maps.google.com/?q=${selectedOrder.latitude},${selectedOrder.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          <MapPin className="w-3 h-3" />
                          View on map
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => contactCustomer(
                        selectedOrder.customer_phone,
                        selectedOrder.order_number,
                        selectedOrder.customer_name
                      )}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      Contact Customer
                    </Button>
                  </div>
                </div>

                {/* Status Updates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label className="mb-2 block">Order Status</Label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="mb-2 block">Payment Status</Label>
                    <select
                      value={selectedOrder.payment_status}
                      onChange={(e) => updatePaymentStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {PAYMENT_STATUS_OPTIONS.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Delivery Assignment */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Assign to Delivery
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="Delivery person phone (with country code)"
                      value={deliveryPhone}
                      onChange={(e) => setDeliveryPhone(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendToDelivery}
                      disabled={!deliveryPhone}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                      Send via WhatsApp
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter delivery person's phone and click to send order details via WhatsApp
                  </p>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map(item => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-3 border border-border rounded-lg"
                      >
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.product_title}</p>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">${item.subtotal}</p>
                          <p className="text-sm text-muted-foreground">${item.price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">${selectedOrder.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-foreground">${selectedOrder.shipping_cost}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">${selectedOrder.total}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}