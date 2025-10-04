import { useState, useEffect } from "react"
import { LayoutDashboard, ShoppingBag, Package, Layers, ShoppingCart, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import DashboardContent from "./DashboardContent"
import ClothTypesPage from "./TopLevel"
import CategoriesPage from "./SecondLevel"
import ProductsPage from "./Products"
import OrdersPage from "./AdminOrders"

const API_URL = import.meta.env.VITE_API_URL

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [adminUser, setAdminUser] = useState({ username: "" })
  const [genders, setGenders] = useState([])
  const [productTypes, setProductTypes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem("admin_user")
    if (user) {
      setAdminUser(JSON.parse(user))
    }
    fetchInitialData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")
    window.location.href = "/admin/login"
  }

  const fetchInitialData = async () => {
    const token = localStorage.getItem("admin_token")

    try {
      const [gendersRes, productTypesRes] = await Promise.all([
        fetch(`${API_URL}/admin/genders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/product-types`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (gendersRes.ok) {
        setGenders(await gendersRes.json())
      }
      if (productTypesRes.ok) {
        setProductTypes(await productTypesRes.json())
      }
    } catch (error) {
      console.error("[v0] Failed to fetch initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchInitialData()
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "cloth-types", label: "Genders", icon: Layers },
    { id: "categories", label: "Product Types", icon: Package },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "orders", label: "Orders", icon: ShoppingCart },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -264 }}
            animate={{ x: 0 }}
            exit={{ x: -264 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground w-64 z-40 border-r border-sidebar-border"
          >
            <div className="p-6 border-b border-sidebar-border">
              <h2 className="text-2xl font-bold">Admin Panel</h2>
              <p className="text-sidebar-foreground/60 text-sm mt-1">{adminUser.username}</p>
            </div>

            <nav className="p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <motion.div key={item.id} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => setCurrentPage(item.id)}
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start gap-3 ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </motion.div>
                )
              })}
            </nav>

            <div className="absolute bottom-0 w-full p-4 border-t border-sidebar-border">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        animate={{ marginLeft: sidebarOpen ? 256 : 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button onClick={() => setSidebarOpen(!sidebarOpen)} variant="ghost" size="icon">
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <h1 className="text-2xl font-bold text-foreground capitalize">{currentPage.replace("-", " ")}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{adminUser.username}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
              {adminUser.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-lg border border-border p-8"
          >
            {currentPage === "dashboard" && <DashboardContent />}

            {currentPage === "products" && <ProductsPage productTypes={productTypes} genders={genders} />}

            {currentPage === "cloth-types" && <ClothTypesPage genders={genders} onRefresh={refreshData} />}

            {currentPage === "categories" && (
              <CategoriesPage productTypes={productTypes} genders={genders} onRefresh={refreshData} />
            )}

            {currentPage === "orders" && (
              <OrdersPage />
            )}
          </motion.div>
        </main>
      </motion.div>
    </div>
  )
}
