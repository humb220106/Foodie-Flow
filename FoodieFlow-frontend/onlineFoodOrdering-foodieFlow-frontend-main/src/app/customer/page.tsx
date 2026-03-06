"use client"

import Image from "next/image"
import Link from "next/link"
import { Search, Star, Clock, MapPin, Filter } from "lucide-react"
import { restaurants } from "@/data/restaurants"

export default function RestaurantsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Restaurants</h1>
          <p className="text-gray-600 mt-2">Discover amazing food from local restaurants</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for restaurants..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Restaurants Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Link 
              key={restaurant.id} 
              href={`/customer/restaurants/${restaurant.id}`}
              className="group"
            >
              <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <Image
                    src={restaurant.image}
                    alt={restaurant.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Rating Badge */}
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-bold shadow-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {restaurant.rating}
                  </div>

                  {/* Status Badge */}
                  {restaurant.status === "OPEN" ? (
                    <div className="absolute left-3 bottom-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white uppercase">
                      Open
                    </div>
                  ) : (
                    <div className="absolute left-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white uppercase">
                      Closed
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900">{restaurant.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {restaurant.tags.join(" • ")}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{restaurant.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-orange-600">{restaurant.price}</span>
                      <span className="text-emerald-600">{restaurant.delivery}</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}