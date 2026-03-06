"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { adminService, FoodType } from "@/lib/api/admin-service"

interface AddFoodTypeModalProps {
  foodType?: FoodType | null
  onClose: () => void
  onSuccess: () => void
}

// Predefined icons
const FOOD_ICONS = [
  { id: "leaf", emoji: "🌿", label: "Leaf" },
  { id: "meat", emoji: "🥩", label: "Meat" },
  { id: "fish", emoji: "🐟", label: "Fish" },
  { id: "egg", emoji: "🥚", label: "Egg" },
  { id: "cheese", emoji: "🧀", label: "Cheese" },
  { id: "more", emoji: "...", label: "More" },
]

// Predefined colors
const FOOD_COLORS = [
  { id: "green", value: "#10B981", label: "Green" },
  { id: "red", value: "#EF4444", label: "Red" },
  { id: "blue", value: "#3B82F6", label: "Blue" },
  { id: "orange", value: "#FF4D00", label: "Orange" },
  { id: "purple", value: "#A855F7", label: "Purple" },
  { id: "yellow", value: "#F59E0B", label: "Yellow" },
  { id: "gray", value: "#6B7280", label: "Gray" },
]

export default function AddFoodTypeModal({
  foodType,
  onClose,
  onSuccess,
}: AddFoodTypeModalProps) {
  const [name, setName] = useState(foodType?.name || "")
  const [description, setDescription] = useState(foodType?.description || "")
  const [selectedIcon, setSelectedIcon] = useState(foodType?.icon || "leaf")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!foodType

  // Prevent closing when clicking inside the modal
  function handleModalClick(e: React.MouseEvent) {
    e.stopPropagation()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Food type name is required")
      return
    }

    try {
      setIsSubmitting(true)

      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon || undefined,
      }

      if (isEditing) {
        await adminService.updateFoodType(foodType.id, data)
      } else {
        await adminService.createFoodType(data)
      }

      onSuccess()
    } catch (err: any) {
      console.error("Failed to save food type:", err)
      setError(err.message || "Failed to save food type. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!isEditing) return
    if (!confirm("Are you sure you want to delete this food type?")) return

    try {
      setIsSubmitting(true)
      await adminService.deleteFoodType(foodType.id)
      onSuccess()
    } catch (err: any) {
      console.error("Failed to delete food type:", err)
      setError(err.message || "Failed to delete food type. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between sticky top-0 bg-white pb-4 border-b z-10">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {isEditing ? `Edit Food Type: ${foodType.name}` : "Add New Food Type"}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditing
                ? "Update category information and visual identity."
                : "Create a new dietary preference category."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Food Type Name */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Food Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vegetarian"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this food category and its dietary restrictions..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Icon Selection
            </label>
            <div className="grid grid-cols-6 gap-2">
              {FOOD_ICONS.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => setSelectedIcon(icon.id)}
                  className={`flex h-14 items-center justify-center rounded-lg border-2 text-2xl transition ${
                    selectedIcon === icon.id
                      ? "border-[#FF4D00] bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  title={icon.label}
                >
                  {icon.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="rounded-lg px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                🗑️ Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Saving..."}
                </>
              ) : isEditing ? (
                "Update Changes"
              ) : (
                "Save Food Type"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}