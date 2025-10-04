"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, X, Search, ImageIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"

const API_URL = import.meta.env.VITE_API_URL;

// INTERFACE RENAMING
interface Gender {
  id: number
  name: string
}

interface ProductType {
  id: number
  name: string
  gender: {
    id: number
    name: string
  }
}

interface Product {
  id: number
  title: string
  price: string
  original_price: string | null
  images: string[]
  in_stock: boolean
  is_new: boolean
  is_sale: boolean
  sales_count: number
  product_type: {
    id: number
    name: string
  }
}

interface ProductsPageProps {
  productTypes: ProductType[]
  genders: Gender[]
}

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"]
const PRESET_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#10B981" },
  { name: "Yellow", hex: "#F59E0B" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Brown", hex: "#92400E" },
  { name: "Beige", hex: "#D4C5B9" },
]

export default function ProductsPage({ productTypes, genders }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  
  const [filterProductType, setFilterProductType] = useState<number | null>(null) 
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [selectedGenderId, setSelectedGenderId] = useState<string>("") 
  const [customSize, setCustomSize] = useState("")
  const [customColor, setCustomColor] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    original_price: "",
    product_type_id: "",
    images: [""],
    sizes: [] as string[],
    colors: [] as string[],
    in_stock: true,
    is_new: false,
    is_sale: false,
  })

  const token = localStorage.getItem("admin_token")

  useEffect(() => {
    fetchProducts()
  }, [currentPage, filterProductType])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let url = `${API_URL}/admin/products?page=${currentPage}&per_page=12`
      if (filterProductType) url += `&product_type_id=${filterProductType}` 

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
        setTotalPages(data.pages)
      }
    } catch (err) {
      console.error("Failed to fetch products:", err)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData({
      title: "",
      description: "",
      price: "",
      original_price: "",
      product_type_id: "",
      images: [""],
      sizes: [],
      colors: [],
      in_stock: true,
      is_new: false,
      is_sale: false,
    })
    setSelectedGenderId("")
    setCustomSize("")
    setCustomColor("")
    setError("")
    setShowModal(true)
  }

  const openEditModal = async (product: Product) => {
    try {
      const res = await fetch(`${API_URL}/admin/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setEditingId(product.id)

        const productType = productTypes.find((pt) => pt.id === data.product_type_id) 
        setSelectedGenderId(productType?.gender.id.toString() || "")

        setFormData({
          title: data.title,
          description: data.description || "",
          price: data.price,
          original_price: data.original_price || "",
          product_type_id: data.product_type_id.toString(),
          images: data.images.length > 0 ? data.images : [""],
          sizes: data.sizes || [],
          colors: data.colors || [],
          in_stock: data.in_stock,
          is_new: data.is_new,
          is_sale: data.is_sale,
        })
        setError("")
        setShowModal(true)
      }
    } catch (err) {
      setError("Failed to load product details")
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setError("")
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.product_type_id) { 
      setError("Title, price, and product type are required")
      return
    }
    setLoading(true)
    setError("")
    
    try {
      const url = editingId ? `${API_URL}/admin/products/${editingId}` : `${API_URL}/admin/products`
      const method = editingId ? "PUT" : "POST"
      
      const payload = {
        ...formData,
        product_type_id: Number.parseInt(formData.product_type_id),
        images: formData.images.filter((img) => img.trim()),
        sizes: formData.sizes,
        colors: formData.colors.map(c => c.toLowerCase()),
        price: Number.parseFloat(formData.price),
        original_price: formData.original_price ? Number.parseFloat(formData.original_price) : null,
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
        fetchProducts()
      } else {
        setError(data.error || "Failed to save product")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return
    try {
      const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        fetchProducts()
      } else {
        alert("Failed to delete product.")
      }
    } catch (err) {
      alert("Network error during deletion.")
    }
  }

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData({ ...formData, images: newImages })
  }

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ""] })
  }

  const removeImageField = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })
  }

  const addSize = (size: string) => {
    if (size && !formData.sizes.includes(size)) {
      setFormData({ ...formData, sizes: [...formData.sizes, size] })
      setCustomSize("")
    }
  }

  const removeSize = (size: string) => {
    setFormData({ ...formData, sizes: formData.sizes.filter((s) => s !== size) })
  }

  const addColor = (colorName: string) => {
    if (colorName && !formData.colors.includes(colorName)) {
      setFormData({ ...formData, colors: [...formData.colors, colorName] })
      setCustomColor("")
    }
  }

  const removeColor = (colorName: string) => {
    setFormData({ ...formData, colors: formData.colors.filter((c) => c !== colorName) })
  }

  const availableProductTypes = productTypes.filter(pt => 
    pt.gender.id.toString() === selectedGenderId
  )
  
  const productFilter = products
    .filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Products</h2>
        <Button onClick={openAddModal}>
          <Plus className="w-5 h-5 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-grow">
          <Input 
            placeholder="Search products by title..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        
        <Select 
          value={filterProductType ? String(filterProductType) : "all"}
          onValueChange={(value) => setFilterProductType(value === "all" ? null : Number(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Product Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Product Types</SelectItem>
            {productTypes.map((pt) => (
              <SelectItem key={pt.id} value={String(pt.id)}>
                {pt.gender.name} - {pt.name} 
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Product List */}
      <div className="space-y-4">
        {loading && <p className="text-center text-muted-foreground">Loading products...</p>}
        {!loading && productFilter.length === 0 && <p className="text-center text-muted-foreground">No products found.</p>}

        {productFilter.map((p) => {
          const fullProductType = productTypes.find(pt => pt.id === p.product_type.id)
          const parentGenderName = fullProductType ? fullProductType.gender.name : 'N/A'
          
          return (
            <div 
              key={p.id} 
              className="flex items-center justify-between p-4 bg-card shadow-sm rounded-lg border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                {p.images && p.images[0] ? (
                  <img src={p.images[0]} alt={p.title} className="w-12 h-12 object-cover rounded" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">${p.price} 
                    {p.original_price && p.is_sale && <span className="ml-2 line-through text-red-500">${p.original_price}</span>}
                  </p>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{p.product_type.name}</p>
                <p className="text-xs text-muted-foreground">{parentGenderName}</p>
              </div>

              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${p.in_stock ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                  {p.in_stock ? 'In Stock' : 'Out of Stock'}
                </span>
                <Button variant="ghost" size="icon" onClick={() => openEditModal(p)}>
                  <Edit2 className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <Button 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1 || loading}
          variant="outline"
        >
          Previous
        </Button>
        <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
        <Button 
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || loading}
          variant="outline"
        >
          Next
        </Button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 0.5 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={closeModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="bg-card rounded-lg shadow-2xl w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h3 className="text-xl font-semibold">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                  <Button variant="ghost" size="icon" onClick={closeModal}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Slim Fit Denim Jeans"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detailed product description..."
                        rows={4}
                        className="mt-2 w-full p-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="99.99"
                          className="mt-2"
                        />
                      </div>
                      <div className="w-1/2">
                        <Label htmlFor="original_price">Original Price ($)</Label>
                        <Input
                          id="original_price"
                          type="number"
                          step="0.01"
                          value={formData.original_price || ""}
                          onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                          placeholder="129.99"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    {/* IMAGE INPUTS - FIXED */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label>Images (URLs)</Label>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={addImageField}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Image
                        </Button>
                      </div>
                      {formData.images.map((image, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            type="url"
                            value={image}
                            onChange={(e) => handleImageChange(index, e.target.value)}
                            placeholder={`Image URL ${index + 1}`}
                            className="flex-grow"
                          />
                          {formData.images.length > 1 && (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeImageField(index)}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium border-b pb-2">Classification</h4>
                    
                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={selectedGenderId}
                          onValueChange={(value) => {
                            setSelectedGenderId(value)
                            setFormData(prev => ({ ...prev, product_type_id: "" })) 
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {genders.map((g) => (
                              <SelectItem key={g.id} value={String(g.id)}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-1/2">
                        <Label htmlFor="product_type">Product Type</Label>
                        <Select
                          value={formData.product_type_id}
                          onValueChange={(value) => setFormData({ ...formData, product_type_id: value })}
                          disabled={!selectedGenderId}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder={selectedGenderId ? "Select Type" : "Select Gender first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProductTypes.map((pt) => (
                              <SelectItem key={pt.id} value={String(pt.id)}>
                                {pt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-medium border-b pb-2 pt-4">Attributes</h4>

                    {/* Sizes - FIXED */}
                    <div>
                      <Label>Available Sizes</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {PRESET_SIZES.map((size) => (
                          <Button
                            key={size}
                            type="button"
                            variant={formData.sizes.includes(size) ? "default" : "outline"}
                            size="sm"
                            onClick={() => (formData.sizes.includes(size) ? removeSize(size) : addSize(size))}
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                      
                      {/* Show custom sizes that are selected */}
                      {formData.sizes.filter(s => !PRESET_SIZES.includes(s)).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.sizes.filter(s => !PRESET_SIZES.includes(s)).map((size) => (
                            <Button
                              key={size}
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => removeSize(size)}
                            >
                              {size}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="text"
                          value={customSize}
                          onChange={(e) => setCustomSize(e.target.value.toUpperCase())}
                          placeholder="Custom size (e.g., 28W)"
                        />
                        <Button 
                          type="button"
                          onClick={() => addSize(customSize)} 
                          disabled={!customSize} 
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Colors - FIXED */}
                    <div>
                      <Label>Available Colors</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {PRESET_COLORS.map((color) => (
                          <Button
                            key={color.name}
                            type="button"
                            variant={formData.colors.includes(color.name) ? "default" : "outline"}
                            size="sm"
                            style={formData.colors.includes(color.name) ? { backgroundColor: color.hex, color: color.hex === '#000000' ? '#ffffff' : '#000000' } : {}}
                            onClick={() => (formData.colors.includes(color.name) ? removeColor(color.name) : addColor(color.name))}
                            className="shadow-md"
                          >
                            {color.name}
                          </Button>
                        ))}
                      </div>
                      
                      {/* Show custom colors that are selected */}
                      {formData.colors.filter(c => !PRESET_COLORS.some(pc => pc.name === c)).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.colors.filter(c => !PRESET_COLORS.some(pc => pc.name === c)).map((color) => (
                            <Button
                              key={color}
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => removeColor(color)}
                            >
                              {color}
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="text"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          placeholder="Custom color (e.g., Teal)"
                        />
                        <Button 
                          type="button"
                          onClick={() => addColor(customColor)} 
                          disabled={!customColor} 
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-medium border-b pb-2 pt-4">Product Flags</h4>
                    
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.in_stock}
                          onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-sm text-foreground">In Stock</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_new}
                          onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-sm text-foreground">New</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_sale}
                          onChange={(e) => setFormData({ ...formData, is_sale: e.target.checked })}
                          className="w-4 h-4 rounded border-border"
                        />
                        <span className="text-sm text-foreground">On Sale</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button onClick={closeModal} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Saving..." : "Save Product"}
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