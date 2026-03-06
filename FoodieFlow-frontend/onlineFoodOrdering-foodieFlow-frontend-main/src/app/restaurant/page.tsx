"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  Utensils,
  BarChart3,
  Truck,
  Headphones,
  ShieldCheck,
  ChevronDown,
  Eye,
  EyeOff,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from "lucide-react"
import { authService } from "@/lib/api/auth-service"

function cx(...v: Array<string | false | undefined>) {
  return v.filter(Boolean).join(" ")
}

export default function RestaurantOwnerRegisterPage() {
  const router = useRouter()
  
  // Step control
  const [currentStep, setCurrentStep] = useState(1)
  
  // Step 1: User credentials
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Step 2: Restaurant information
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantDescription, setRestaurantDescription] = useState("")
  const [restaurantPhone, setRestaurantPhone] = useState("")
  const [cuisineType, setCuisineType] = useState("")
  const [taxId, setTaxId] = useState("")

  // Location
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("")
  const [postalCode, setPostalCode] = useState("")

  // Images
  const [restaurantLogo, setRestaurantLogo] = useState<File | null>(null)
  const [restaurantBanner, setRestaurantBanner] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  // UI state
  const [agree, setAgree] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Validation for Step 1
  const canProceedToStep2 = useMemo(() => {
    return (
      /^[a-zA-Z]{3,50}$/.test(username.trim()) &&
      email.trim().length >= 6 &&
      phone.trim().length >= 8 &&
      phone.trim().length <= 20 &&
      password.trim().length >= 8 &&
      confirmPassword === password
    )
  }, [username, email, phone, password, confirmPassword])

  // Validation for Step 2 (final submit)
  const canSubmit = useMemo(() => {
    return (
      canProceedToStep2 &&
      restaurantName.trim().length >= 3 &&
      restaurantName.trim().length <= 100 &&
      agree &&
      !isLoading
    )
  }, [canProceedToStep2, restaurantName, agree, isLoading])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setRestaurantLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setRestaurantBanner(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setRestaurantLogo(null)
    setLogoPreview(null)
  }

  const removeBanner = () => {
    setRestaurantBanner(null)
    setBannerPreview(null)
  }

  const goToStep2 = () => {
    setErrorMsg(null)
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBackToStep1 = () => {
    setErrorMsg(null)
    setCurrentStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
// Updated restaurant registration - only the onSubmit function needs to change

async function onSubmit(e: React.FormEvent) {
  e.preventDefault()
  setErrorMsg(null)
  setSuccessMsg(null)

  try {
    setIsLoading(true)

    const formData = new FormData()

    // Required fields
    formData.append("username", username.trim())
    formData.append("email", email.trim())
    formData.append("password", password)
    formData.append("phone", phone.trim())
    formData.append("restaurantName", restaurantName.trim())
    
    // ✅ CRITICAL: Add role field with exact case "Restaurant"
    formData.append("role", "Restaurant")

    // Optional fields - only append if they have values
    if (restaurantDescription.trim()) {
      formData.append("restaurantDescription", restaurantDescription.trim())
    }
    if (restaurantPhone.trim()) {
      formData.append("restaurantPhone", restaurantPhone.trim())
    }
    if (cuisineType.trim()) {
      formData.append("cuisineType", cuisineType.trim())
    }
    if (taxId.trim()) {
      formData.append("taxID", taxId.trim())
    }
    if (address.trim()) {
      formData.append("address", address.trim())
    }
    if (city.trim()) {
      formData.append("city", city.trim())
    }
    if (state.trim()) {
      formData.append("state", state.trim())
    }
    if (country.trim()) {
      formData.append("country", country.trim())
    }
    if (postalCode.trim()) {
      formData.append("postalCode", postalCode.trim())
    }

    // Images
    if (restaurantLogo) {
      formData.append("restaurantLogo", restaurantLogo)
    }
    if (restaurantBanner) {
      formData.append("restaurantBanner", restaurantBanner)
    }

    // ✅ Use registerRestaurant endpoint (multipart/form-data)
    const response = await authService.registerRestaurant(formData)

    setSuccessMsg(
      response.message || "Registration successful! Redirecting to login..."
    )

    // Redirect straight to login — email verification is disabled
    setTimeout(() => {
      router.push("/login")
    }, 1500)
  } catch (err: any) {
    console.error("Registration error:", err)
    setErrorMsg(err.message || "Something went wrong. Please try again.")
  } finally {
    setIsLoading(false)
  }
}

  return (
    <main className="min-h-screen bg-[#F4F4F4]">
      {/* Top Nav */}
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3 font-black text-gray-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF4D00] shadow-sm">
              <Utensils className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg">
              Foodie<span className="text-[#FF4D00]">Flow</span>
            </span>
          </Link>

          <Link
            href="/login"
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:border-[#FF4D00] hover:text-[#FF4D00] transition"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Body */}
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
          {/* Left Marketing Panel */}
          <div className="lg:pr-8">
            <div className="sticky top-10">
              <h1 className="text-4xl font-black text-gray-900">
                Grow your restaurant with FoodieFlow
              </h1>
              <p className="mt-4 text-base text-gray-600">
                Join thousands of restaurants already increasing their revenue and
                reaching new customers through our platform.
              </p>

              <div className="mt-10 space-y-6">
                <Feature
                  icon={<BarChart3 className="h-5 w-5" />}
                  title="Boost Revenue by 30%+"
                  desc="Increase orders with our intelligent recommendation engine and customer targeting."
                />
                <Feature
                  icon={<Truck className="h-5 w-5" />}
                  title="Reliable Delivery Network"
                  desc="Our verified delivery partners ensure your food arrives fresh and on time."
                />
                <Feature
                  icon={<Headphones className="h-5 w-5" />}
                  title="24/7 Dedicated Support"
                  desc="Get help whenever you need it from our restaurant success team."
                />
                <Feature
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Zero Setup Fees"
                  desc="Get started for free. Only pay a small commission on successful orders."
                />
              </div>

              <div className="mt-10 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-orange-600 p-6 text-white">
                <p className="text-sm font-bold opacity-90">Success Story</p>
                <p className="mt-2 text-lg font-black leading-snug">
                  "FoodieFlow helped us reach 5,000+ new customers in just 3 months!"
                </p>
                <p className="mt-3 text-sm opacity-80">
                  — Sarah Chen, Owner of Golden Dragon
                </p>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div>
            <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
              {/* Progress Indicator */}
              <div className="mb-8 flex items-center gap-2">
                <div
                  className={cx(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition",
                    currentStep === 1
                      ? "bg-[#FF4D00] text-white"
                      : "bg-emerald-500 text-white"
                  )}
                >
                  {currentStep === 1 ? "1" : <CheckCircle className="h-4 w-4" />}
                </div>
                <div
                  className={cx(
                    "h-0.5 flex-1 rounded transition",
                    currentStep === 2 ? "bg-[#FF4D00]" : "bg-gray-200"
                  )}
                />
                <div
                  className={cx(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition",
                    currentStep === 2
                      ? "bg-[#FF4D00] text-white"
                      : "bg-gray-200 text-gray-400"
                  )}
                >
                  2
                </div>
              </div>

              {/* Error & Success Messages */}
              {errorMsg && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {successMsg}
                </div>
              )}

              {/* Step 1 - User Credentials */}
              {currentStep === 1 && (
                <form onSubmit={(e) => { e.preventDefault(); goToStep2(); }}>
                  <SectionTitle number="1" title="Your Account Information" />

                  <div className="mt-6 space-y-5">
                    <Field
                      label="Username"
                      placeholder="johndoe"
                      value={username}
                      onChange={setUsername}
                      required
                      helperText="3-50 characters, letters only"
                    />

                    <Field
                      label="Email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={setEmail}
                      type="email"
                      required
                    />

                    <Field
                      label="Phone Number"
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChange={setPhone}
                      type="tel"
                      required
                      helperText="8-20 characters"
                    />

                    <PasswordField
                      label="Password"
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggle={() => setShowPassword(!showPassword)}
                      required
                      helperText="At least 8 characters"
                    />

                    <PasswordField
                      label="Confirm Password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      show={showConfirm}
                      onToggle={() => setShowConfirm(!showConfirm)}
                      required
                    />

                    {confirmPassword && confirmPassword === password && (
                      <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Passwords match!
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!canProceedToStep2}
                    className="mt-8 group w-full rounded-xl bg-[#FF4D00] px-6 py-3.5 text-sm font-black text-white shadow-md shadow-orange-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Continue to Restaurant Info
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </button>

                  <div className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login" className="font-black text-[#FF4D00] hover:underline">
                      Login
                    </Link>
                  </div>
                </form>
              )}

              {/* Step 2 - Restaurant Information */}
              {currentStep === 2 && (
                <form onSubmit={onSubmit}>
                  <SectionTitle number="2" title="Restaurant Details" />

                  <div className="mt-6 space-y-5">
                    <Field
                      label="Restaurant Name"
                      placeholder="Joe's Pizza"
                      value={restaurantName}
                      onChange={setRestaurantName}
                      required
                      helperText="3-100 characters"
                    />

                    <div>
                      <label className="text-xs font-black text-gray-700">
                        Description
                        <span className="ml-1 text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        value={restaurantDescription}
                        onChange={(e) => setRestaurantDescription(e.target.value)}
                        placeholder="Tell customers about your restaurant..."
                        rows={3}
                        maxLength={500}
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        {restaurantDescription.length}/500 characters
                      </p>
                    </div>

                    <Field
                      label="Restaurant Phone"
                      placeholder="+1 234 567 8900"
                      value={restaurantPhone}
                      onChange={setRestaurantPhone}
                      type="tel"
                      optional
                    />

                    <SelectField
                      label="Cuisine Type"
                      value={cuisineType}
                      onChange={setCuisineType}
                      placeholder="Select cuisine type"
                      options={[
                        "American",
                        "Chinese",
                        "Italian",
                        "Mexican",
                        "Japanese",
                        "Indian",
                        "Thai",
                        "Mediterranean",
                        "Fast Food",
                        "Other"
                      ]}
                      optional
                    />

                    <Field
                      label="Tax ID / Business Registration"
                      placeholder="12-3456789"
                      value={taxId}
                      onChange={setTaxId}
                      optional
                    />

                    <div className="border-t border-gray-100 pt-5">
                      <p className="text-xs font-black text-gray-700 mb-4">Location Information (Optional)</p>
                      
                      <div className="space-y-5">
                        <Field
                          label="Address"
                          placeholder="123 Main Street"
                          value={address}
                          onChange={setAddress}
                          optional
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <Field
                            label="City"
                            placeholder="New York"
                            value={city}
                            onChange={setCity}
                            optional
                          />
                          <Field
                            label="State/Province"
                            placeholder="NY"
                            value={state}
                            onChange={setState}
                            optional
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Field
                            label="Country"
                            placeholder="USA"
                            value={country}
                            onChange={setCountry}
                            optional
                          />
                          <Field
                            label="Postal Code"
                            placeholder="10001"
                            value={postalCode}
                            onChange={setPostalCode}
                            optional
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <p className="text-xs font-black text-gray-700 mb-4">Restaurant Images (Optional)</p>
                      
                      <div className="space-y-5">
                        <ImageUpload
                          label="Restaurant Logo"
                          file={restaurantLogo}
                          preview={logoPreview}
                          onChange={handleLogoChange}
                          onRemove={removeLogo}
                          helperText="Recommended: Square image, 500x500px"
                        />

                        <ImageUpload
                          label="Restaurant Banner"
                          file={restaurantBanner}
                          preview={bannerPreview}
                          onChange={handleBannerChange}
                          onRemove={removeBanner}
                          helperText="Recommended: 1200x400px"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#FF4D00] focus:ring-[#FF4D00]"
                      />
                      <label className="text-xs text-gray-700">
                        I agree to FoodieFlow's{" "}
                        <a href="#" className="font-bold text-[#FF4D00] hover:underline">
                          Terms of Service
                        </a>
                        ,{" "}
                        <a href="#" className="font-bold text-[#FF4D00] hover:underline">
                          Privacy Policy
                        </a>
                        , and{" "}
                        <a href="#" className="font-bold text-[#FF4D00] hover:underline">
                          Restaurant Partner Agreement
                        </a>
                        .
                      </label>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      type="button"
                      onClick={goBackToStep1}
                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-6 py-3.5 text-sm font-black text-gray-700 transition hover:border-gray-300"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="group flex-1 rounded-xl bg-[#FF4D00] px-6 py-3.5 text-sm font-black text-white shadow-md shadow-orange-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                      {!isLoading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 text-xs text-gray-500 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="opacity-80">🍴</span>
            <span className="font-semibold text-gray-700">FoodiePartner</span>
            <span>© {new Date().getFullYear()} FoodiePartner Inc.</span>
          </div>
          <div className="flex items-center gap-6">
            <a className="hover:text-[#FF4D00]" href="#">
              Help Center
            </a>
            <a className="hover:text-[#FF4D00]" href="#">
              Cookie Policy
            </a>
            <a className="hover:text-[#FF4D00]" href="#">
              Contact
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

/* ---------- Components ---------- */

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF4D00]/10 text-[#FF4D00]">
        {icon}
      </span>
      <div>
        <p className="text-sm font-black text-gray-900">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">{desc}</p>
      </div>
    </div>
  )
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FF4D00]/10 text-xs font-black text-[#FF4D00]">
        {number}
      </span>
      <p className="text-sm font-black text-gray-900">{title}</p>
    </div>
  )
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  optional = false,
  helperText,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  optional?: boolean
  helperText?: string
}) {
  return (
    <div>
      <label className="text-xs font-black text-gray-700">
        {label}
        {optional && <span className="ml-1 text-gray-400 font-normal">(Optional)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
      />
      {helperText && <p className="mt-1 text-xs text-gray-400">{helperText}</p>}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
  optional = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
  optional?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-black text-gray-700">
        {label}
        {optional && <span className="ml-1 text-gray-400 font-normal">(Optional)</span>}
      </label>
      <div className="relative mt-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
        >
          <option value="" disabled className="text-gray-500">
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  )
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  required = false,
  helperText,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  required?: boolean
  helperText?: string
}) {
  return (
    <div>
      <label className="text-xs font-black text-gray-700">{label}</label>
      <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {helperText && <p className="mt-1 text-xs text-gray-400">{helperText}</p>}
    </div>
  )
}

function ImageUpload({
  label,
  file,
  preview,
  onChange,
  onRemove,
  helperText,
}: {
  label: string
  file: File | null
  preview: string | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  helperText?: string
}) {
  return (
    <div>
      <label className="text-xs font-black text-gray-700">
        {label}
        <span className="ml-1 text-gray-400 font-normal">(Optional)</span>
      </label>

      {preview ? (
        <div className="mt-2 relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4">
          <img
            src={preview}
            alt="Preview"
            className="mx-auto max-h-48 rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 transition"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="mt-2 text-center text-xs text-gray-600">{file?.name}</p>
        </div>
      ) : (
        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 transition hover:border-[#FF4D00] hover:bg-orange-50">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm font-semibold text-gray-700">Click to upload image</p>
          <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          <input
            type="file"
            accept="image/*"
            onChange={onChange}
            className="hidden"
          />
        </label>
      )}

      {helperText && <p className="mt-1 text-xs text-gray-400">{helperText}</p>}
    </div>
  )
}