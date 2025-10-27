// API Service for managing all API calls
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081/api";

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
  getAllListings: async () => {
    const timestamp = new Date().getTime();
    const response = await fetch(
      `${API_BASE_URL}/listings?sortBy=newest&page=1&limit=100&_t=${timestamp}`,
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
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
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
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
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

// Export the base URL for reference
export { API_BASE_URL };
