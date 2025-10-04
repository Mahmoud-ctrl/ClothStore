"use client"

import type React from "react"

// Checkout.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/contexts/CartContext"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Loader2, CheckCircle2, MapPin, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const STORAGE_KEY = "checkout_customer_data"

interface SavedCustomerData {
  customer_name: string
  customer_phone: string
  address_line1: string
  city: string
  latitude: number | null
  longitude: number | null
}

const Checkout = () => {
  const { state, clearCart } = useCart()
  const router = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [showLocationError, setShowLocationError] = useState(false)
  const [showSavedDataPrompt, setShowSavedDataPrompt] = useState(false)
  const [savedData, setSavedData] = useState<SavedCustomerData | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  // Detect if user is on desktop
  useEffect(() => {
    const checkDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsDesktop(!isMobile)
    }
    checkDevice()
  }, [])

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    address_line1: "",
    city: "",
    latitude: null as number | null,
    longitude: null as number | null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const subtotal = state.total
  const shipping = subtotal >= 100 ? 0 : 10
  const total = subtotal + shipping

  // Load saved data on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data: SavedCustomerData = JSON.parse(stored)
        setSavedData(data)
        setShowSavedDataPrompt(true)
      } catch (e) {
        console.error("Failed to parse saved data:", e)
      }
    }
  }, [])

  const useSavedData = () => {
    if (savedData) {
      setFormData(savedData)
      setShowSavedDataPrompt(false)
      toast({
        title: "Data loaded",
        description: "Your saved information has been loaded",
      })
    }
  }

  const dismissSavedData = () => {
    setShowSavedDataPrompt(false)
  }

  const saveCustomerData = () => {
    const dataToSave: SavedCustomerData = {
      customer_name: formData.customer_name.trim(),
      customer_phone: formData.customer_phone.trim(),
      address_line1: formData.address_line1.trim(),
      city: formData.city.trim(),
      latitude: formData.latitude,
      longitude: formData.longitude,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
  }

  const getLocationAddress = async (latitude: number, longitude: number) => {
    try {
      // Using OpenStreetMap's Nominatim API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        },
      )

      const data = await response.json()

      if (data.address) {
        const address = data.address
        const streetAddress = [address.house_number, address.road || address.street].filter(Boolean).join(" ")

        const city = address.city || address.town || address.village || address.county || ""

        return {
          address_line1: streetAddress || data.display_name.split(",")[0],
          city: city,
        }
      }

      return null
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      return null
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      })
      return
    }

    setLoadingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords

        // Check if accuracy is poor (> 1000 meters = 1km)
        const isLowAccuracy = accuracy > 1000

        const addressData = await getLocationAddress(latitude, longitude)

        if (addressData) {
          setFormData((prev) => ({
            ...prev,
            address_line1: addressData.address_line1,
            city: addressData.city,
            latitude: latitude,
            longitude: longitude,
          }))

          // Clear errors for these fields
          setErrors((prev) => ({
            ...prev,
            address_line1: "",
            city: "",
          }))

          if (isLowAccuracy) {
            toast({
              title: "Location found (Low accuracy)",
              description: `Accuracy: ±${Math.round(accuracy)}m. Please verify the address is correct or enter it manually.`,
              variant: "destructive",
            })
          } else {
            toast({
              title: "Location found",
              description: `Accurate to ±${Math.round(accuracy)}m`,
            })
          }
        } else {
          // Even if address lookup fails, save coordinates
          setFormData((prev) => ({
            ...prev,
            latitude: latitude,
            longitude: longitude,
          }))

          toast({
            title: "Coordinates saved",
            description: `Accuracy: ±${Math.round(accuracy)}m. Please enter the address manually.`,
            variant: "destructive",
          })
        }

        setLoadingLocation(false)
      },
      (error) => {
        setLoadingLocation(false)

        if (error.code === error.PERMISSION_DENIED) {
          setShowLocationError(true)
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast({
            title: "Location unavailable",
            description: "Unable to determine your location. Please enter address manually.",
            variant: "destructive",
          })
        } else if (error.code === error.TIMEOUT) {
          toast({
            title: "Request timeout",
            description: "Location request timed out. Please try again.",
            variant: "destructive",
          })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = "Name is required"
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = "Phone number is required"
    } else if (!/^[\d+()-]+$/.test(formData.customer_phone)) {
      newErrors.customer_phone = "Invalid phone number format (no spaces allowed)"
    }

    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = "Address is required"
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Check the form for validation errors",
        variant: "destructive",
      })
      return
    }

    if (state.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to your cart before checking out",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const orderData = {
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone.trim(),
        address_line1: formData.address_line1.trim(),
        city: formData.city.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        items: state.items.map((item) => ({
          product_id: Number.parseInt(item.product.id),
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
      }

      const response = await api.createOrder(orderData)

      if (response.success) {
        // Save customer data for future use
        saveCustomerData()

        setOrderNumber(response.order.order_number)
        setOrderComplete(true)
        clearCart()

        toast({
          title: "Order placed successfully!",
          description: `Your order number is ${response.order.order_number}`,
        })
      }
    } catch (error) {
      console.error("Order creation failed:", error)
      toast({
        title: "Order failed",
        description: error instanceof Error ? error.message : "Failed to create order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (state.items.length === 0 && !orderComplete) {
    return (
      <div className="container mx-auto px-4 py-12 sm:py-20 text-center">
        <h1 className="text-2xl sm:text-3xl font-light mb-4 sm:mb-6">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6 sm:mb-8">Add items to your cart before checking out.</p>
        <Button onClick={() => router("/")}>Continue Shopping</Button>
      </div>
    )
  }

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-12 sm:py-20 max-w-2xl text-center">
        <CheckCircle2 className="h-16 w-16 sm:h-20 sm:w-20 text-green-500 mx-auto mb-4 sm:mb-6" />
        <h1 className="text-2xl sm:text-3xl font-light mb-3 sm:mb-4">Order Placed Successfully!</h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-2">Thank you for your order!</p>
        <p className="text-base sm:text-lg font-medium mb-6 sm:mb-8">
          Order Number: <span className="text-primary">{orderNumber}</span>
        </p>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
          We'll contact you shortly to confirm your order and arrange delivery.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button onClick={() => router("/")} variant="outline" className="w-full sm:w-auto">
            Continue Shopping
          </Button>
          <Button onClick={() => router(`/orders/${orderNumber}`)} className="w-full sm:w-auto">
            Track Order
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <Button onClick={() => router("/cart")} variant="ghost" className="mb-4 sm:mb-8 -ml-2 sm:-ml-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Back to Cart</span>
        <span className="sm:hidden">Back</span>
      </Button>

      {showSavedDataPrompt && (
        <Alert className="mb-4 sm:mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Existing data found</AlertTitle>
          <AlertDescription>
            <p className="mb-3">Would you like to use your previously saved information?</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" onClick={useSavedData} className="w-full sm:w-auto">
                Use Saved Data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={dismissSavedData}
                className="w-full sm:w-auto bg-transparent"
              >
                Start Fresh
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Location Permission Error Dialog */}
      <Dialog open={showLocationError} onOpenChange={setShowLocationError}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Location Permission Required</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>To use the automatic location feature, you need to allow location access.</p>
              <p className="font-medium">How to enable location:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click the location icon in your browser's address bar</li>
                <li>Select "Allow" or "Always allow"</li>
                <li>Refresh the page and try again</li>
              </ol>
              <p className="text-sm">Alternatively, you can enter your address manually below.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowLocationError(false)} className="w-full sm:w-auto">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-2xl sm:text-3xl font-light mb-4 sm:mb-8">Checkout</h1>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-medium mb-4">Customer Information</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer_name">Full Name *</Label>
                  <Input
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={errors.customer_name ? "border-red-500" : ""}
                  />
                  {errors.customer_name && <p className="text-sm text-red-500 mt-1">{errors.customer_name}</p>}
                </div>

                <div>
                  <Label htmlFor="customer_phone">Phone Number *</Label>
                  <Input
                    id="customer_phone"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    placeholder="+961XXXXXXXX"
                    type="tel"
                    className={errors.customer_phone ? "border-red-500" : ""}
                  />
                  {errors.customer_phone && <p className="text-sm text-red-500 mt-1">{errors.customer_phone}</p>}
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <Label htmlFor="address_line1" className="flex items-center gap-2">
                      Address *
                      {formData.latitude && formData.longitude && (
                        <span className="text-xs text-green-600 font-normal">✓ GPS saved</span>
                      )}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGetLocation}
                      disabled={loadingLocation}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      {loadingLocation ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          <span className="hidden sm:inline">Getting location...</span>
                          <span className="sm:hidden">Getting...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-3 w-3" />
                          <span className="hidden sm:inline">Get Precise Location</span>
                          <span className="sm:hidden">Get Location</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {isDesktop && (
                    <Alert className="mb-2 py-2">
                      <div className="flex items-center gap-1">
                        <Info className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <AlertDescription className="text-xs">
                          <strong>Desktop detected:</strong> Location may be less accurate. We recommend using your phone
                          or manually entering your address.
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}

                  <Input
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    className={errors.address_line1 ? "border-red-500" : ""}
                  />
                  {errors.address_line1 && <p className="text-sm text-red-500 mt-1">{errors.address_line1}</p>}
                  {formData.latitude && formData.longitude && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      Location saved - Please verify the address is correct
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Beirut"
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border border-border lg:sticky lg:top-8">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-medium mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 max-h-48 sm:max-h-64 overflow-y-auto">
                {state.items.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex gap-3">
                    <img
                      src={item.product.image || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 text-sm min-w-0">
                      <p className="font-medium truncate">{item.product.name}</p>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        {item.size}
                        {item.color ? ` • ${item.color}` : ""} × {item.quantity}
                      </p>
                      <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                </div>
                {subtotal >= 100 && <p className="text-xs text-green-600">Free shipping applied!</p>}
                <div className="flex justify-between font-medium text-base sm:text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full mt-6" size="lg" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
                We'll call you to confirm your order and arrange payment on delivery
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Checkout
