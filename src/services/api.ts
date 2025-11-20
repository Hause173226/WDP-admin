// API Service for managing all API calls
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Helper function to get auth headers for POST requests
const getAuthHeadersWithContentType = () => {
  const token = localStorage.getItem("token");
  return {
    accept: "*/*",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Listings API
export const listingsService = {
  // Get pending listings
  getPendingListings: async () => {
    const timestamp = new Date().getTime();
    const response = await fetch(
      `${API_BASE_URL}/admin/listings/pending?_t=${timestamp}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get all listings
  getAllListings: async (page: number = 1, limit: number = 100) => {
    const timestamp = new Date().getTime();
    const normalizedBase = API_BASE_URL.replace(/\/$/, "");
    const baseUrl = normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`;
    const response = await fetch(
      `${baseUrl}/admin/listings/all?page=${page}&limit=${limit}&_t=${timestamp}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Approve listing
  approveListing: async (listingId: string) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/listings/${listingId}/approve`,
      {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to approve listing");
    }

    return response.json();
  },

  // Reject listing
  rejectListing: async (
    listingId: string,
    reason: string = "Không đạt yêu cầu chất lượng"
  ) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/listings/${listingId}/reject`,
      {
        method: "POST",
        headers: getAuthHeadersWithContentType(),
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to reject listing");
    }

    return response.json();
  },

  // Get admin listings with status filter
  getAdminListings: async (params: { status?: string }) => {
    const timestamp = new Date().getTime();
    const normalizedBase = API_BASE_URL.replace(/\/$/, "");
    const baseUrl = normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`;

    let url = `${baseUrl}/admin/listings`;
    const queryParams = new URLSearchParams();

    if (params.status) {
      if (params.status === "PendingReview") {
        url = `${baseUrl}/admin/listings/pending`;
      } else {
        queryParams.append("status", params.status);
      }
    }

    queryParams.append("_t", timestamp.toString());
    url += `?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

// Users API
export const usersService = {
  // Get all users
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get user by ID
  getUserById: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  },

  // Sign out
  signOut: async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/signout`, {
      method: "POST",
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    // Don't throw error for signout, just log it
    if (!response.ok) {
      console.warn("Signout API failed, but continuing with local cleanup");
    }

    return response.ok;
  },

  // Update user status
  updateUserStatus: async (userId: string, status: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "PUT",
      headers: getAuthHeadersWithContentType(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update user status");
    }

    return response.json();
  },
};

// Auth API
export const authService = {
  // Login
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/users/signin`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed");
    }

    return response.json();
  },

  // Register
  register: async (userData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/users/signup`, {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed");
    }

    return response.json();
  },
};

// Transactions API
export const transactionsService = {
  // Get all transactions
  getAllTransactions: async (page: number = 1, limit: number = 20) => {
    const timestamp = new Date().getTime();
    // Normalize base URL - remove trailing slash and check if /api is already included
    const normalizedBase = API_BASE_URL.replace(/\/$/, ""); // Remove trailing slash
    const baseUrl = normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`;
    const response = await fetch(
      `${baseUrl}/transactions/all?page=${page}&limit=${limit}&_t=${timestamp}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get transaction detail by appointmentId
  getTransactionDetail: async (appointmentId: string) => {
    const normalizedBase = API_BASE_URL.replace(/\/$/, "");
    const baseUrl = normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`;
    const response = await fetch(`${baseUrl}/transactions/${appointmentId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

// System Wallet API
export const systemWalletService = {
  // Get system wallet info
  getSystemWallet: async () => {
    const normalizedBase = API_BASE_URL.replace(/\/$/, "");
    const baseUrl = normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`;
    const response = await fetch(`${baseUrl}/system-wallet`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get system wallet transaction history
  getSystemWalletTransactions: async (page: number = 1, limit: number = 20) => {
    const normalizedBase = API_BASE_URL.replace(/\/$/, "");
    const baseUrl = normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`;
    const response = await fetch(
      `${baseUrl}/system-wallet/transactions?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get system wallet transaction detail
  getSystemWalletTransactionDetail: async (id: string) => {
    const normalizedBase = API_BASE_URL.replace(/\/$/, "");
    const baseUrl = normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`;
    const response = await fetch(
      `${baseUrl}/system-wallet/transactions/${id}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get system wallet chart data
  getSystemWalletChart: async (
    period?: "day" | "month" | "year",
    startDate?: string,
    endDate?: string
  ) => {
    const normalizedBase = API_BASE_URL.replace(/\/$/, "");
    const baseUrl = normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`;

    const params = new URLSearchParams();
    if (period) {
      params.append("period", period);
    }
    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${baseUrl}/system-wallet/chart?${queryString}`
      : `${baseUrl}/system-wallet/chart`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Get revenue chart data
  getRevenueChartData: async (
    period?: "day" | "month" | "year",
    startDate?: string,
    endDate?: string
  ) => {
    const normalizedBase = API_BASE_URL.replace(/\/$/, "");
    const baseUrl = normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`;

    const params = new URLSearchParams();
    if (period) {
      params.append("period", period);
    }
    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${baseUrl}/system-wallet/revenue-chart?${queryString}`
      : `${baseUrl}/system-wallet/revenue-chart`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }
      if (response.status === 403) {
        throw new Error("Bạn không có quyền truy cập dữ liệu này.");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

// Export the base URL for reference
export { API_BASE_URL };
