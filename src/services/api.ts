// ---- Base & normalize ----
const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081";
// bỏ dấu "/" cuối
const BASE = RAW_BASE.replace(/\/+$/, "");
// nếu BASE đã có "/api" cuối thì dùng luôn, nếu chưa thì thêm
const API_BASE = /\/api$/.test(BASE) ? BASE : `${BASE}/api`;

/* --------------------------------
 * Helpers
 * -------------------------------- */
const getToken = () => localStorage.getItem("token") || "";

const buildHeaders = (json = false) => {
  const h: Record<string, string> = { accept: "application/json" };
  if (json) h["Content-Type"] = "application/json";
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

const qs = (params: Record<string, unknown> = {}) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");

const withCacheBuster = (url: string) => {
  const u = new URL(url);
  u.searchParams.set("_t", String(Date.now()));
  return u.toString();
};

// path không cần bắt đầu bằng "/"
const url = (path: string, params?: Record<string, unknown>) => {
  const p = path.replace(/^\/+/, "");
  const full = `${API_BASE}/${p}`;
  return withCacheBuster(params ? `${full}?${qs(params)}` : full);
};

async function safeParseJSON(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* --------------------------------
 * Listings API
 * -------------------------------- */
export const listingsService = {
  /**
   * Admin list đa trạng thái + keyword + pagination
   * GET /api/admin/listings?status=PendingReview|Published|Rejected&keyword=&page=&limit=
   */
  getAdminListings: async (params: {
    status: "PendingReview" | "Published" | "Rejected";
    page?: number;
    limit?: number;
    keyword?: string;
  }) => {
    const res = await fetch(url("admin/listings", params), {
      method: "GET",
      headers: buildHeaders(),
    });
    if (!res.ok) {
      const err = await safeParseJSON(res);
      throw new Error(err?.message || `HTTP error ${res.status}`);
    }
    return res.json(); // { listings, pagination } (tuỳ BE)
  },

  /**
   * LEGACY: pending queue cũ
   * GET /api/admin/listings/pending
   */
  getPendingListings: async () => {
    const res = await fetch(url("admin/listings/pending"), {
      method: "GET",
      headers: buildHeaders(),
    });
    if (!res.ok) {
      const err = await safeParseJSON(res);
      throw new Error(err?.message || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  // Public search all listings (đã duyệt)
  getAllListings: async () => {
    const res = await fetch(
      url("listings", { sortBy: "newest", page: 1, limit: 100 }),
      { method: "GET", headers: buildHeaders() }
    );
    if (!res.ok) {
      const err = await safeParseJSON(res);
      throw new Error(err?.message || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  // Approve listing (Admin)
  approveListing: async (listingId: string) => {
    const res = await fetch(url(`admin/listings/${listingId}/approve`), {
      method: "POST",
      headers: buildHeaders(),
    });
    if (!res.ok) {
      const err = await safeParseJSON(res);
      throw new Error(err?.message || "Failed to approve listing");
    }
    return res.json();
  },

  // Reject listing (Admin)
  rejectListing: async (listingId: string, reason?: string) => {
    const res = await fetch(url(`admin/listings/${listingId}/reject`), {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify({
        reason: reason ?? "Không đạt yêu cầu chất lượng",
      }),
    });
    if (!res.ok) {
      const err = await safeParseJSON(res);
      throw new Error(err?.message || "Failed to reject listing");
    }
    return res.json();
  },
};

/* --------------------------------
 * Users API
 * -------------------------------- */
export const usersService = {
  getAllUsers: async () => {
    const res = await fetch(url("users"), {
      method: "GET",
      headers: buildHeaders(),
    });
    if (!res.ok) {
      const err = await safeParseJSON(res);
      throw new Error(err?.message || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  getUserById: async (userId: string) => {
    const res = await fetch(url(`users/${userId}`), {
      method: "GET",
      headers: buildHeaders(),
    });
    if (!res.ok) {
      const err = await safeParseJSON(res);
      throw new Error(err?.message || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  signOut: async () => {
    const res = await fetch(url("users/signout"), {
      method: "POST",
      headers: buildHeaders(),
    });
    if (!res.ok) console.warn("Signout API failed, continue local cleanup");
    return res.ok;
  },

  updateUserStatus: async (userId: string, status: string) => {
    const res = await fetch(url(`users/${userId}`), {
      method: "PUT",
      headers: buildHeaders(true),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await safeParseJSON(res);
      throw new Error(err?.message || "Failed to update user status");
    }
    return res.json();
  },
};

/* --------------------------------
 * Auth API
 * -------------------------------- */
export const authService = {
  login: async (email: string, password: string) => {
    const res = await fetch(url("users/signin"), {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await safeParseJSON(res);
      throw new Error(err?.message || "Login failed");
    }
    return res.json();
  },

  register: async (userData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => {
    const res = await fetch(url("users/signup"), {
      method: "POST",
      headers: buildHeaders(true),
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await safeParseJSON(res);
      throw new Error(err?.message || "Registration failed");
    }
    return res.json();
  },
};

// Export the base URL for reference (đã normalize)
export { API_BASE as API_BASE_URL };
