"use client"

import Image from "next/image"
import Link from "next/link"
import { Search, MapPin, ChevronDown, Utensils, Leaf, Drumstick, Star, Zap, Clock, ArrowRight, Globe, MessageCircle, Mail, Heart, TrendingUp, Shield, Truck, Percent, Menu } from "lucide-react"
import { restaurants, type Restaurant } from "@/data/restaurants"

const FILTERS = [
  { key: "all", label: "All", icon: Utensils },
  { key: "veg", label: "Veg", icon: Leaf },
  { key: "non-veg", label: "Non-Veg", icon: Drumstick },
  { key: "top-rated", label: "Top Rated", icon: Star },
  { key: "fastest", label: "Fastest Delivery", icon: Zap },
]

function classNames(...v: Array<string | false | undefined>) {
  return v.filter(Boolean).join(" ")
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Redesigned Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        {/* Main Header Bar */}
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-20 items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                {/* Logo */}
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg">
                  <Utensils className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">
                  Foodie<span className="text-orange-600">Flow</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium -mt-0.5">Deliver happiness to your door</p>
              </div>
            </div>

            {/* Center Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <a 
                href="#offers" 
                className="text-sm font-semibold text-gray-700 hover:text-orange-600 transition-colors scroll-smooth"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Offers
              </a>
              <a 
                href="#restaurants" 
                className="text-sm font-semibold text-gray-700 hover:text-orange-600 transition-colors scroll-smooth"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Restaurants
              </a>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Auth Buttons */}
              <Link href="/login" className="hidden md:block rounded-full border-2 border-gray-300 px-5 py-2 text-sm font-bold text-gray-700 hover:border-orange-600 hover:text-orange-600 transition-all">
                Login
              </Link>

             <Link href="/register(customer)"  className="hidden md:block rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 hover:scale-105 transition-all">
                Sign Up
              </Link>

              {/* Mobile Menu */}
              <button className="lg:hidden rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors">
                <Menu className="h-6 w-6 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-white">
        <div className="container relative mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            {/* Left Content */}
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-100 to-orange-50 px-4 py-2 w-fit">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700">#1 Food Delivery</span>
              </div>
              
              <h1 className="mt-6 text-4xl font-black tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
                Savor the <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Flavor</span>, Skip the Wait
              </h1>
              
              <p className="mt-4 text-lg text-gray-600">
                From local favorites to premium dining—delivered fresh to your door in minutes.
              </p>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-900">5,000+</div>
                  <div className="text-sm text-gray-600">Restaurants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-900">15-30</div>
                  <div className="text-sm text-gray-600">Min Delivery</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-900">4.9★</div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="relative h-[400px] w-full overflow-hidden rounded-3xl shadow-2xl shadow-orange-500/10">
                <Image
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop"
                  alt="Delicious food"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Floating Card */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 overflow-hidden rounded-full">
                            <Image
                              src="https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=100&h=100&fit=crop"
                              alt="Chef"
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Chef's Special</p>
                            <p className="text-xs text-gray-500">Truffle Pasta</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-gray-900">$24.99</div>
                        <div className="text-xs text-gray-500">45% OFF</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-y border-gray-100 bg-white py-4">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Safe Delivery</p>
                <p className="text-xs text-gray-500">Contactless</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Live Tracking</p>
                <p className="text-xs text-gray-500">Real-time updates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Fast Delivery</p>
                <p className="text-xs text-gray-500">15-30 mins</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Percent className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Best Prices</p>
                <p className="text-xs text-gray-500">Price match</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-t bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 py-5">
          <div className="flex flex-wrap gap-3">
            {FILTERS.map((filter, idx) => {
              const Icon = filter.icon
              return (
                <button
                  key={filter.key}
                  className={classNames(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    idx === 0
                      ? "border-transparent bg-orange-500 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Popular Restaurants */}
      <section className="bg-gray-50 pb-12" id="restaurants">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between pt-6">
            <div>
              <h2 className="text-xl font-extrabold">Popular Restaurants</h2>
              <span className="mt-2 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-500">
                Near you
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {restaurants.map((r) => (
              <article
                key={r.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md cursor-pointer"
              >
                <div className="relative h-36 w-full">
                  <Image src={r.image} alt={r.name} fill className="object-cover" />
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-bold shadow-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {r.rating}
                  </div>

                  {r.status === "OPEN" ? (
                    <div className="absolute left-3 bottom-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white uppercase">
                      Open
                    </div>
                  ) : (
                    <div className="absolute left-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white uppercase">
                      Currently Closed
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-base font-extrabold">{r.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {r.tags.join(", ")}
                  </p>

                  <div className="mt-3 border-t pt-3 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{r.time}</span>
                      </div>
                      <span className="font-bold text-orange-500">
                        {r.price} • {r.delivery}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section id="offers" className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-[#f5f0e6] to-[#f8f4ec] p-8 md:p-12">
            <div className="grid items-center gap-8 md:grid-cols-2">
              {/* Left content */}
              <div className="space-y-6">
                

                {/* Main heading */}
                <div>
                  <h2 className="text-4xl font-light tracking-tight text-gray-900 md:text-5xl">
                    Safe delivery, every time
                    <br />
                    <span className="font-bold">Fresh, secure, and right on time</span>
                  </h2>
                </div>

                {/* Subtext */}
                <p className="text-lg text-gray-600 leading-relaxed">
                  Join thousands of happy foodies today.
                </p>

               
              </div>

              {/* Right content - image with overlay */}
              <div className="relative">
                {/* Main image container */}
                <div className="relative mx-auto h-[400px] w-full max-w-md overflow-hidden rounded-3xl">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#e6dfd1] to-[#f0ebe1]" />
                  
                  {/* Image */}
                  <div className="absolute inset-0">
                    <Image
                      src="https://cdn.vectorstock.com/i/1000v/19/45/motorbike-delivery-man-logo-icon-symbol-template-vector-28931945.jpg"
                      alt="Pasta dish"
                      width={600}
                      height={600}
                      className="h-full w-full object-cover mix-blend-multiply opacity-90"
                    />
                  </div>
                  
                  {/* Text overlay */}
                          <div className="absolute left-6 top-6 z-10">
              <div className="space-y-1">
                <p className="text-sm font-medium tracking-wide text-white/90">
                  Trusted Riders
                </p>
                <p className="text-2xl font-extrabold tracking-tight text-white">
                  Safe Delivery
                </p>
                  <p className="text-xs tracking-wide text-white/80">
                    Sealed • Contactless • Secure
                  </p>
                </div>
               </div>
                  
                  {/* Decorative circle */}
                  <div className="absolute bottom-6 right-6 h-24 w-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/20" />
                </div>
              </div>
            </div>
            

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 md:px-6 grid gap-8 py-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-extrabold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                <Utensils className="h-4 w-4" />
              </span>
              <span className="text-orange-500">FoodieFlow</span>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Bringing your favorite meals from the best local restaurants directly
              to your doorstep. Fast, fresh, and delicious.
            </p>
          </div>

          <div>
            <p className="text-sm font-extrabold">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><a className="hover:text-black" href="#">About Us</a></li>
              <li><a className="hover:text-black" href="#">Careers</a></li>
              <li><a className="hover:text-black" href="#">Team</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-extrabold">Support</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><a className="hover:text-black" href="#">Help Center</a></li>
              <li><a className="hover:text-black" href="#">Contact Us</a></li>
              <li><a className="hover:text-black" href="#">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-extrabold">Newsletter</p>
            <p className="mt-3 text-sm text-gray-600">
              Stay updated with our latest offers and restaurants.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-orange-500"
                placeholder="Email"
                type="email"
              />
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t py-5">
          <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-between gap-3 text-xs text-gray-500 md:flex-row">
            <p>© {new Date().getFullYear()} FoodieFlow. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Globe className="h-4 w-4 cursor-pointer hover:text-orange-500" />
              <MessageCircle className="h-4 w-4 cursor-pointer hover:text-orange-500" />
              <Mail className="h-4 w-4 cursor-pointer hover:text-orange-500" />
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}