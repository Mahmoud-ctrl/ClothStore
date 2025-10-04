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

interface GendersPageProps {
  genders: Gender[]
  onRefresh: () => void
}

export default function GendersPage({ genders, onRefresh }: GendersPageProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: "", slug: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem("admin_token")

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ name: "", slug: "" })
    setError("")
    setShowModal(true)
  }

  const openEditModal = (gender: Gender) => {
    setEditingId(gender.id)
    setFormData({ name: gender.name, slug: gender.slug })
    setError("")
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ name: "", slug: "" })
    setError("")
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      setError("Name and slug are required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const url = editingId ? `${API_URL}/admin/genders/${editingId}` : `${API_URL}/admin/genders`
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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

  const handleDelete = async (id: number, hasProductTypes: boolean) => {
    if (hasProductTypes) {
      setError("Cannot delete a Gender that still has Product Types associated with it.")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (!confirm("Delete this Gender?")) return

    try {
      const res = await fetch(`${API_URL}/admin/genders/${id}`, {
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Genders (Top Level)</h2>
          <p className="text-muted-foreground mt-1">
            Manage top-level categories like Men, Women, Kids, Unisex. 
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-5 h-5 mr-2" />
          Add Gender
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

      {genders.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <p className="text-muted-foreground mb-4">No genders yet</p>
          <Button onClick={openAddModal} variant="link" className="text-foreground">
            Add your first gender category
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {genders.map((gender, index) => (
            <motion.div
              key={gender.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="border border-border rounded-lg p-4 bg-card transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-foreground text-lg">{gender.name}</h3>
                  <p className="text-sm text-muted-foreground">/{gender.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => openEditModal(gender)} variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(gender.id, gender.product_types_count > 0)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    disabled={gender.product_types_count > 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {gender.product_types_count} product {gender.product_types_count === 1 ? "type" : "types"}
              </div>
            </motion.div>
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
                  <h3 className="text-xl font-bold text-foreground">{editingId ? "Edit Gender" : "Add Gender"}</h3>
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
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setFormData({ name, slug: generateSlug(name) })
                      }}
                      placeholder="e.g., Men, Women, Kids"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug (URL-friendly)</Label>
                    <Input
                      id="slug"
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g., men, women, kids"
                      className="mt-2"
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
