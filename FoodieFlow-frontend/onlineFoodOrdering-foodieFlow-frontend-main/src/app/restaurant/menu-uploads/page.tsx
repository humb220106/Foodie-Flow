"use client"

import { useEffect, useState } from "react"
import RestaurantSidebar from "@/components/layout/RestaurantSidebar"
import {
  restaurantService,
  MenuResponse,
  MenuSummaryResponse,
  MenuSectionResponse,
  DishResponse,
  CreateMenuRequest,
  CreateMenuSectionRequest,
} from "@/lib/api/restaurant-service"
import {
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  X,
  Star,
  GripVertical,
  BookOpen,
  ListTree,
  Tag,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "none" }
  | { type: "createMenu" }
  | { type: "addSection"; menuId: string }
  | { type: "editSection"; menuId: string; sectionId: string; current: MenuSectionResponse }
  | { type: "addDish"; menuId: string; sectionId: string }

export default function MenuBuilderPage() {
  const [restaurant, setRestaurant] = useState<{ id: string; restaurantName: string } | null>(null)
  const [menus, setMenus] = useState<MenuSummaryResponse[]>([])
  const [expandedMenu, setExpandedMenu] = useState<MenuResponse | null>(null)
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null)
  const [myDishes, setMyDishes] = useState<DishResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [sectionLoading, setSectionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ type: "none" })

  // form state
  const [menuName, setMenuName] = useState("")
  const [menuDescription, setMenuDescription] = useState("")
  const [menuIsDefault, setMenuIsDefault] = useState(false)
  const [sectionName, setSectionName] = useState("")
  const [sectionDescription, setSectionDescription] = useState("")
  const [sectionOrder, setSectionOrder] = useState("1")
  const [selectedDishId, setSelectedDishId] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const me = await restaurantService.getMyRestaurant()
      if (!me) { setError("Restaurant profile not found."); return }
      setRestaurant(me)
      const list = await restaurantService.getRestaurantMenus(me.id)
      setMenus(list)

      // Load dishes for dish picker
      const dishes = await restaurantService.getMyDishes(1, 100)
      setMyDishes(dishes.data || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load menus")
    } finally {
      setLoading(false)
    }
  }

  async function loadMenuDetail(menuId: string) {
    try {
      setSectionLoading(true)
      const detail = await restaurantService.getMenuById(menuId)
      setExpandedMenu(detail)
      setExpandedMenuId(menuId)
    } catch (e: any) {
      setError(e?.message || "Failed to load menu detail")
    } finally {
      setSectionLoading(false)
    }
  }

  function toggleMenu(menuId: string) {
    if (expandedMenuId === menuId) {
      setExpandedMenuId(null)
      setExpandedMenu(null)
    } else {
      void loadMenuDetail(menuId)
    }
  }

  function flash(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  function closeModal() {
    setModal({ type: "none" })
    setMenuName(""); setMenuDescription(""); setMenuIsDefault(false)
    setSectionName(""); setSectionDescription(""); setSectionOrder("1")
    setSelectedDishId(""); setSaving(false)
  }

  // ── Create Menu ─────────────────────────────────────────────────────────────

  async function handleCreateMenu() {
    if (!menuName.trim()) { setError("Menu name is required."); return }
    setError(null); setSaving(true)
    try {
      await restaurantService.createMenu({
        name: menuName.trim(),
        description: menuDescription.trim() || undefined,
        isDefault: menuIsDefault,
      })
      closeModal()
      await load()
      flash("Menu created!")
    } catch (e: any) {
      setError(e?.message || "Failed to create menu")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete Menu ─────────────────────────────────────────────────────────────

  async function handleDeleteMenu(menuId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setError(null)
    try {
      await restaurantService.deleteMenu(menuId)
      if (expandedMenuId === menuId) { setExpandedMenuId(null); setExpandedMenu(null) }
      await load()
      flash("Menu deleted.")
    } catch (e: any) {
      setError(e?.message || "Failed to delete menu")
    }
  }

  // ── Toggle Default ──────────────────────────────────────────────────────────

  async function handleSetDefault(menuId: string) {
    setError(null)
    try {
      await restaurantService.updateMenu(menuId, { isDefault: true })
      await load()
      flash("Default menu updated!")
    } catch (e: any) {
      setError(e?.message || "Failed to update menu")
    }
  }

  // ── Add Section ─────────────────────────────────────────────────────────────

  async function handleAddSection() {
    if (modal.type !== "addSection") return
    if (!sectionName.trim()) { setError("Section name is required."); return }
    setError(null); setSaving(true)
    try {
      await restaurantService.addMenuSection(modal.menuId, {
        name: sectionName.trim(),
        description: sectionDescription.trim() || undefined,
        displayOrder: parseInt(sectionOrder) || 1,
      })
      closeModal()
      await loadMenuDetail(modal.menuId)
      flash("Section added!")
    } catch (e: any) {
      setError(e?.message || "Failed to add section")
    } finally {
      setSaving(false)
    }
  }

  // ── Edit Section ────────────────────────────────────────────────────────────

  async function handleEditSection() {
    if (modal.type !== "editSection") return
    if (!sectionName.trim()) { setError("Section name is required."); return }
    setError(null); setSaving(true)
    try {
      await restaurantService.updateMenuSection(modal.menuId, modal.sectionId, {
        name: sectionName.trim(),
        description: sectionDescription.trim() || undefined,
        displayOrder: parseInt(sectionOrder) || 1,
      })
      closeModal()
      await loadMenuDetail(modal.menuId)
      flash("Section updated!")
    } catch (e: any) {
      setError(e?.message || "Failed to update section")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete Section ──────────────────────────────────────────────────────────

  async function handleDeleteSection(menuId: string, sectionId: string, name: string) {
    if (!confirm(`Delete section "${name}"? All dish links in this section will be removed.`)) return
    setError(null)
    try {
      await restaurantService.deleteMenuSection(menuId, sectionId)
      await loadMenuDetail(menuId)
      flash("Section deleted.")
    } catch (e: any) {
      setError(e?.message || "Failed to delete section")
    }
  }

  // ── Add Dish to Section ─────────────────────────────────────────────────────

  async function handleAddDishToSection() {
    if (modal.type !== "addDish") return
    if (!selectedDishId) { setError("Please select a dish."); return }
    setError(null); setSaving(true)
    try {
      await restaurantService.addDishToSection(modal.menuId, modal.sectionId, selectedDishId)
      closeModal()
      await loadMenuDetail(modal.menuId)
      flash("Dish added to section!")
    } catch (e: any) {
      setError(e?.message || "Failed to add dish")
    } finally {
      setSaving(false)
    }
  }

  // ── Remove Dish from Section ────────────────────────────────────────────────

  async function handleRemoveDish(menuId: string, sectionId: string, dishId: string, name: string) {
    if (!confirm(`Remove "${name}" from this section?`)) return
    setError(null)
    try {
      await restaurantService.removeDishFromSection(menuId, sectionId, dishId)
      await loadMenuDetail(menuId)
      flash("Dish removed from section.")
    } catch (e: any) {
      setError(e?.message || "Failed to remove dish")
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>
        <header className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Menu Builder</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create structured menus with sections and link your existing dishes to them.
              </p>
            </div>
            <button
              onClick={() => setModal({ type: "createMenu" })}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF4D00] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Menu
            </button>
          </div>
        </header>

        <div className="p-8 space-y-4">
          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading menus...
            </div>
          ) : menus.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
              <ListTree className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-500">No menus yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Create a menu (e.g. "Breakfast", "Lunch", "Dinner"), add sections, then link your dishes.
              </p>
              <button
                onClick={() => setModal({ type: "createMenu" })}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-2 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Create First Menu
              </button>
            </div>
          ) : (
            menus.map((menu) => (
              <div key={menu.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Menu header row */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <button onClick={() => toggleMenu(menu.id)} className="text-gray-400 hover:text-gray-600">
                    {expandedMenuId === menu.id
                      ? <ChevronDown className="h-5 w-5" />
                      : <ChevronRight className="h-5 w-5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-gray-900 truncate">{menu.name}</h3>
                      {menu.isDefault && (
                        <span className="rounded-full bg-[#FF4D00] px-2 py-0.5 text-[10px] font-bold text-white">
                          Default
                        </span>
                      )}
                      {!menu.isActive && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {menu.sectionCount} section{menu.sectionCount !== 1 ? "s" : ""}
                      {menu.description ? ` • ${menu.description}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!menu.isDefault && (
                      <button
                        onClick={() => handleSetDefault(menu.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setExpandedMenuId(menu.id)
                        setModal({ type: "addSection", menuId: menu.id })
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                    >
                      + Section
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.id, menu.name)}
                      className="rounded-lg border border-red-100 p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded section list */}
                {expandedMenuId === menu.id && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
                    {sectionLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading sections...
                      </div>
                    ) : expandedMenu?.sections?.length === 0 ? (
                      <p className="py-4 text-center text-sm text-gray-400">
                        No sections yet.{" "}
                        <button
                          onClick={() => setModal({ type: "addSection", menuId: menu.id })}
                          className="font-bold text-[#FF4D00] hover:underline"
                        >
                          Add one
                        </button>
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {expandedMenu?.sections?.map((section) => (
                          <div key={section.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                            {/* Section header */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                              <GripVertical className="h-4 w-4 text-gray-300" />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">{section.name}</p>
                                {section.description && (
                                  <p className="text-xs text-gray-400">{section.description}</p>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">Order: {section.displayOrder}</span>
                              <button
                                onClick={() => {
                                  setSectionName(section.name)
                                  setSectionDescription(section.description || "")
                                  setSectionOrder(String(section.displayOrder))
                                  setModal({ type: "editSection", menuId: menu.id, sectionId: section.id, current: section })
                                }}
                                className="rounded p-1 text-gray-400 hover:bg-gray-200"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSection(menu.id, section.id, section.name)}
                                className="rounded p-1 text-red-400 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Dishes in section */}
                            <div className="p-3 space-y-2">
                              {section.dishes?.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-2">No dishes in this section yet.</p>
                              ) : (
                                section.dishes?.map((dish) => (
                                  <div key={dish.dishId} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
                                    {dish.dishImage && (
                                      <img src={dish.dishImage} alt={dish.dishName} className="h-8 w-8 rounded object-cover" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-gray-800 truncate">{dish.dishName}</p>
                                      <p className="text-xs text-gray-400">₦{dish.price?.toLocaleString()}</p>
                                    </div>
                                    {!dish.isAvailable && (
                                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">Unavailable</span>
                                    )}
                                    <button
                                      onClick={() => handleRemoveDish(menu.id, section.id, dish.dishId, dish.dishName)}
                                      className="rounded p-1 text-red-400 hover:bg-red-50"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))
                              )}
                              <button
                                onClick={() => {
                                  setSelectedDishId("")
                                  setModal({ type: "addDish", menuId: menu.id, sectionId: section.id })
                                }}
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-200 py-2 text-xs font-bold text-gray-500 hover:border-[#FF4D00] hover:text-[#FF4D00]"
                              >
                                <Plus className="h-3 w-3" /> Add Dish
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {modal.type !== "none" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Create Menu */}
            {modal.type === "createMenu" && (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-black text-gray-900">Create New Menu</h2>
                  <button onClick={closeModal} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                  <div>
                    <label className="text-xs font-bold text-gray-600">Menu Name *</label>
                    <input value={menuName} onChange={(e) => setMenuName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                      placeholder="e.g. Lunch Menu" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Description</label>
                    <input value={menuDescription} onChange={(e) => setMenuDescription(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                      placeholder="e.g. Available 12pm – 4pm daily" />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={menuIsDefault} onChange={(e) => setMenuIsDefault(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#FF4D00]" />
                    <span className="text-xs font-bold text-gray-700">Set as default menu</span>
                  </label>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                  <button onClick={closeModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Cancel</button>
                  <button onClick={handleCreateMenu} disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Menu
                  </button>
                </div>
              </>
            )}

            {/* Add / Edit Section */}
            {(modal.type === "addSection" || modal.type === "editSection") && (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-black text-gray-900">
                    {modal.type === "editSection" ? "Edit Section" : "Add Section"}
                  </h2>
                  <button onClick={closeModal} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                  <div>
                    <label className="text-xs font-bold text-gray-600">Section Name *</label>
                    <input value={sectionName} onChange={(e) => setSectionName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                      placeholder="e.g. Starters, Mains, Desserts" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Description</label>
                    <input value={sectionDescription} onChange={(e) => setSectionDescription(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                      placeholder="Optional" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Display Order</label>
                    <input type="number" min="1" value={sectionOrder} onChange={(e) => setSectionOrder(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                  <button onClick={closeModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Cancel</button>
                  <button
                    onClick={modal.type === "editSection" ? handleEditSection : handleAddSection}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {modal.type === "editSection" ? "Update" : "Add Section"}
                  </button>
                </div>
              </>
            )}

            {/* Add Dish to Section */}
            {modal.type === "addDish" && (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-black text-gray-900">Add Dish to Section</h2>
                  <button onClick={closeModal} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                  <div>
                    <label className="text-xs font-bold text-gray-600">Select Dish *</label>
                    <select value={selectedDishId} onChange={(e) => setSelectedDishId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00] bg-white">
                      <option value="">— Choose a dish —</option>
                      {myDishes.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title} — ₦{Number(d.price).toLocaleString()}
                          {!d.isAvailable ? " (Unavailable)" : ""}
                        </option>
                      ))}
                    </select>
                    {myDishes.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">No dishes found. Go to Dishes to create some first.</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                  <button onClick={closeModal} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Cancel</button>
                  <button onClick={handleAddDishToSection} disabled={saving || !selectedDishId}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add Dish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}