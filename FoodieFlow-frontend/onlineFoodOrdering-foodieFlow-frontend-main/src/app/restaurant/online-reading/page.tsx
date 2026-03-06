"use client"

import { useEffect, useMemo, useState } from "react"
import RestaurantSidebar from "@/components/layout/RestaurantSidebar"
import {
  restaurantService,
  BookSummaryResponse,
  BookResponse,
  CreateBookRequest,
  UpdateBookRequest,
} from "@/lib/api/restaurant-service"
import {
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  BookOpen,
  ImageIcon,
  Tag,
  Globe,
  FileText,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────

type BookFormState = {
  id?: string
  title: string
  content: string
  excerpt: string
  tags: string
  isPublished: boolean
  coverImage: File | null
}

const emptyForm: BookFormState = {
  title: "",
  content: "",
  excerpt: "",
  tags: "",
  isPublished: false,
  coverImage: null,
}

// Simple rich text editor note
const CONTENT_PLACEHOLDER = `Write your blog post content here...

You can use basic HTML for formatting:
<h2>Subheading</h2>
<p>Paragraph text</p>
<strong>Bold</strong>, <em>Italic</em>
<ul><li>List item</li></ul>`

// ── Book Card ─────────────────────────────────────────────────────────────────

function BookCard({
  book,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  book: BookSummaryResponse
  onEdit: (book: BookSummaryResponse) => void
  onDelete: (id: string, title: string) => void
  onTogglePublish: (id: string, current: boolean) => void
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover */}
      <div className="relative h-36 bg-gray-100">
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-10 w-10 text-gray-300" />
          </div>
        )}
        <span
          className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            book.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {book.isPublished ? "Published" : "Draft"}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-black text-gray-900 truncate">{book.title}</h3>
        {book.excerpt && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{book.excerpt}</p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {book.viewCount} views
          </span>
          {book.publishedAt && (
            <span>{new Date(book.publishedAt).toLocaleDateString()}</span>
          )}
        </div>

        {book.tags && (
          <div className="mt-2 flex flex-wrap gap-1">
            {book.tags.split(",").map((t) => (
              <span key={t} className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] text-[#FF4D00]">
                {t.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onTogglePublish(book.id, book.isPublished)}
            className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-colors ${
              book.isPublished
                ? "border-gray-200 text-gray-700 hover:bg-gray-50"
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {book.isPublished ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={() => onEdit(book)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 px-3 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(book.id, book.title)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-100 py-2 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OnlineReadingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [books, setBooks] = useState<BookSummaryResponse[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<BookFormState>(emptyForm)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const res = await restaurantService.getMyBooks(1, 100)
      setBooks(res.data || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load blog posts")
    } finally {
      setLoading(false)
    }
  }

  // ── Filtered list ────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = books
    if (filterStatus === "published") list = list.filter((b) => b.isPublished)
    if (filterStatus === "draft") list = list.filter((b) => !b.isPublished)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((b) => [b.title, b.tags || "", b.excerpt || ""].join(" ").toLowerCase().includes(q))
    return list
  }, [books, search, filterStatus])

  // ── Modal ────────────────────────────────────────────────────────────────

  function openCreate() {
    setForm(emptyForm)
    setPreviewMode(false)
    setShowModal(true)
  }

  async function openEdit(book: BookSummaryResponse) {
    // Fetch full book for content
    try {
      const full = await restaurantService.getBookById(book.id)
      setForm({
        id: full.id,
        title: full.title,
        content: full.content,
        excerpt: full.excerpt || "",
        tags: full.tags || "",
        isPublished: full.isPublished,
        coverImage: null,
      })
      setPreviewMode(false)
      setShowModal(true)
    } catch (e: any) {
      setError(e?.message || "Failed to load book")
    }
  }

  function closeModal() {
    setShowModal(false)
    setForm(emptyForm)
    setPreviewMode(false)
    setError(null)
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async function onSave() {
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.")
      return
    }
    setError(null)
    try {
      setSaving(true)
      if (form.id) {
        const payload: UpdateBookRequest = {
          title: form.title.trim(),
          content: form.content.trim(),
          excerpt: form.excerpt.trim() || undefined,
          tags: form.tags.trim() || undefined,
          isPublished: form.isPublished,
        }
        if (form.coverImage) payload.coverImage = form.coverImage
        await restaurantService.updateBook(form.id, payload)
        setSuccess("Post updated!")
      } else {
        const payload: CreateBookRequest = {
          title: form.title.trim(),
          content: form.content.trim(),
          excerpt: form.excerpt.trim() || undefined,
          tags: form.tags.trim() || undefined,
          isPublished: form.isPublished,
        }
        if (form.coverImage) payload.coverImage = form.coverImage
        await restaurantService.createBook(payload)
        setSuccess(form.isPublished ? "Post published!" : "Draft saved!")
      }
      closeModal()
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to save post")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      setDeleting(id)
      await restaurantService.deleteBook(id)
      await load()
      setSuccess("Post deleted.")
    } catch (e: any) {
      setError(e?.message || "Failed to delete post")
    } finally {
      setDeleting(null)
    }
  }

  async function onTogglePublish(id: string, current: boolean) {
    try {
      await restaurantService.updateBook(id, { isPublished: !current })
      await load()
      setSuccess(current ? "Saved as draft." : "Published!")
    } catch (e: any) {
      setError(e?.message || "Failed to update post")
    }
  }

  const publishedCount = books.filter((b) => b.isPublished).length
  const draftCount = books.filter((b) => !b.isPublished).length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>
        {/* Header */}
        <header className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Blog Posts</h1>
              <p className="mt-1 text-sm text-gray-500">
                {publishedCount} published · {draftCount} draft{draftCount !== 1 ? "s" : ""} — powered by{" "}
                <code className="rounded bg-gray-100 px-1 text-xs">GET /api/book/my-books</code>
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF4D00] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Post
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="border-b border-gray-200 bg-white px-8 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 w-48"
              placeholder="Search posts..."
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
            {(["all", "published", "draft"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                  filterStatus === s
                    ? "bg-[#FF4D00] text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading posts...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-500">
                {books.length === 0 ? "No blog posts yet" : "No posts match your filter"}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {books.length === 0
                  ? "Share recipes, behind-the-scenes stories, or announcements with your customers."
                  : "Try adjusting the filter or search."}
              </p>
              {books.length === 0 && (
                <button
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-4 py-2 text-xs font-bold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Write First Post
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onEdit={openEdit}
                  onDelete={onDelete}
                  onTogglePublish={onTogglePublish}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-black text-gray-900">
                {form.id ? "Edit Post" : "New Blog Post"}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode((v) => !v)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    previewMode
                      ? "border-[#FF4D00] text-[#FF4D00]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {previewMode ? <FileText className="inline h-3.5 w-3.5 mr-1" /> : <Eye className="inline h-3.5 w-3.5 mr-1" />}
                  {previewMode ? "Edit" : "Preview"}
                </button>
                <button onClick={closeModal} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {previewMode ? (
              /* Preview */
              <div className="p-6 space-y-4">
                {form.coverImage && (
                  <img
                    src={URL.createObjectURL(form.coverImage)}
                    alt="Cover"
                    className="h-48 w-full rounded-xl object-cover"
                  />
                )}
                <h1 className="text-2xl font-black text-gray-900">{form.title || "Untitled"}</h1>
                {form.excerpt && <p className="text-sm text-gray-500 italic">{form.excerpt}</p>}
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: form.content || "<p>No content yet.</p>" }}
                />
                {form.tags && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
                    {form.tags.split(",").map((t) => (
                      <span key={t} className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-[#FF4D00]">{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Edit form */
              <div className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-gray-600">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                    placeholder="e.g. 5 Secrets to Perfect Jollof Rice"
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="text-xs font-bold text-gray-600">Excerpt / Subtitle</label>
                  <input
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                    placeholder="A short summary shown in cards and search results"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="text-xs font-bold text-gray-600">Content * <span className="text-gray-400 font-normal">(HTML supported)</span></label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={10}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-[#FF4D00]"
                    placeholder={CONTENT_PLACEHOLDER}
                  />
                </div>

                {/* Tags + Cover */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-gray-600">Tags (comma-separated)</label>
                    <input
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                      placeholder="recipes, nigerian, rice"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600">Cover Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setForm({ ...form, coverImage: e.target.files?.[0] || null })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-orange-50 file:px-2 file:py-1 file:text-xs file:font-bold file:text-[#FF4D00]"
                    />
                  </div>
                </div>

                {/* Publish toggle */}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#FF4D00]"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-700">Publish immediately</p>
                    <p className="text-[10px] text-gray-400">
                      {form.isPublished ? "Visible to all customers" : "Save as draft — not visible to customers"}
                    </p>
                  </div>
                  <Globe className={`ml-auto h-4 w-4 ${form.isPublished ? "text-emerald-500" : "text-gray-300"}`} />
                </label>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
              <p className="text-xs text-gray-400">
                {form.id
                  ? `Editing post · ${form.isPublished ? "Currently published" : "Currently a draft"}`
                  : form.isPublished ? "Will be published" : "Will be saved as draft"}
              </p>
              <div className="flex gap-3">
                <button onClick={closeModal} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {form.id ? "Update Post" : form.isPublished ? "Publish Post" : "Save Draft"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}