import { useState } from "react"
import { Plus, Edit2, Trash2, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"

const API_URL = import.meta.env.VITE_API_URL

interface Gender {
  id: number
  name: string
  slug: string
  product_types_count: number
}

interface ProductType {
  id: number
  name: string
  slug: string
  gender: {
    id: number
    name: string
    slug: string
  }
  products_count: number
}

interface ProductTypesPageProps {
  productTypes: ProductType[]
  genders: Gender[]
  onRefresh: () => void
}

export default function ProductTypesPage({ productTypes, genders, onRefresh }: ProductTypesPageProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: "", gender_id: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem("admin_token")

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ name: "", gender_id: "" })
    setError("")
    setShowModal(true)
  }

  const openEditModal = (productType: ProductType) => {
    setEditingId(productType.id)
    setFormData({ 
      name: productType.name, 
      gender_id: productType.gender.id.toString()
    })
    setError("")
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ name: "", gender_id: "" })
    setError("")
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.gender_id) {
      setError("Name and parent gender are required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const url = editingId 
        ? `${API_URL}/admin/product-types/${editingId}` 
        : `${API_URL}/admin/product-types`
      const method = editingId ? "PUT" : "POST"

      // Don't send slug - let backend auto-generate it with gender prefix
      const payload = {
        name: formData.name,
        gender_id: parseInt(formData.gender_id)
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        closeModal()
        onRefresh()
      } else {
        setError(data.error || "Failed to save")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, hasProducts: boolean) => {
    if (hasProducts) {
      setError("Cannot delete a Product Type that still has products associated with it.")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (!confirm("Delete this Product Type?")) return

    try {
      const res = await fetch(`${API_URL}/admin/product-types/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        onRefresh()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to delete")
      }
    } catch (err) {
      setError("Network error")
    }
  }

  const generateSlug = (name: string, genderSlug: string) => {
    const baseName = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
    return `${genderSlug}-${baseName}`
  }

  const getPreviewSlug = () => {
    if (!formData.name || !formData.gender_id) return ""
    const selectedGender = genders.find(g => g.id === parseInt(formData.gender_id))
    if (!selectedGender) return ""
    return generateSlug(formData.name, selectedGender.slug)
  }

  // Group product types by gender
  const groupedByGender = genders.map(gender => ({
    gender,
    types: productTypes.filter(pt => pt.gender.id === gender.id)
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Product Types (Second Level)</h2>
          <p className="text-muted-foreground mt-1">
            Manage product types like T-Shirts, Jeans, Hoodies under each gender category
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-5 h-5 mr-2" />
          Add Product Type
        </Button>
      </div>

      <AnimatePresence>
        {error && !showModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert className="mb-4 bg-destructive/10 border-destructive/50">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {productTypes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <p className="text-muted-foreground mb-4">No product types yet</p>
          <Button onClick={openAddModal} variant="link" className="text-foreground">
            Add your first product type
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {groupedByGender.map(({ gender, types }) => (
            types.length > 0 && (
              <div key={gender.id}>
                <h3 className="text-xl font-bold text-foreground mb-4">{gender.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {types.map((type, index) => (
                    <motion.div
                      key={type.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="border border-border rounded-lg p-4 bg-card transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground">{type.name}</h4>
                          <p className="text-sm text-muted-foreground">/{type.slug}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => openEditModal(type)} variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(type.id, type.products_count > 0)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            disabled={type.products_count > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {type.products_count} {type.products_count === 1 ? "product" : "products"}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={closeModal}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card rounded-lg max-w-md w-full p-6 pointer-events-auto border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">
                    {editingId ? "Edit Product Type" : "Add Product Type"}
                  </h3>
                  <Button onClick={closeModal} variant="ghost" size="icon">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {error && (
                  <Alert className="mb-4 bg-destructive/10 border-destructive/50">
                    <AlertDescription className="text-destructive">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="gender">Parent Gender</Label>
                    <select
                      id="gender"
                      value={formData.gender_id}
                      onChange={(e) => setFormData({ ...formData, gender_id: e.target.value })}
                      className="w-full mt-2 px-3 py-2 bg-background border border-input rounded-md"
                    >
                      <option value="">Select Gender</option>
                      {genders.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., T-Shirts, Jeans, Hoodies"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Slug (URL-friendly)</Label>
                    <Input
                      type="text"
                      value={getPreviewSlug()}
                      disabled
                      className="mt-2 bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Auto-generated from name</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button onClick={closeModal} variant="outline" className="flex-1 bg-transparent">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}