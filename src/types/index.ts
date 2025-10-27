/* =========================
 * User (giữ nguyên, không đổi cấu trúc)
 * ========================= */
export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "user" | "admin" | "staff";
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  stats?: {
    soldCount: number;
    buyCount: number;
    cancelRate: number;
    responseTime: number;
    completionRate: number;
  };
  refreshToken?: string;
  roles?: string;
  address?: {
    fullAddress: string;
    ward: string;
    district: string;
    city: string;
    province: string;
    isActive: boolean;
    _id: string;
    createdAt: string;
    updatedAt: string;
  };
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
}

/* =========================
 * Media (bổ sung publicId & metadata Cloudinary)
 * ========================= */
export interface Media {
  url: string;
  kind: "photo" | "doc";
  publicId?: string;   // Cloudinary public_id
  width?: number;
  height?: number;
  format?: string;     // jpg/png/webp...
}

/* =========================
 * Listing (mở rộng để khớp backend)
 * ========================= */
export type ListingStatus =
  | "Draft"
  | "PendingReview"
  | "Published"
  | "InTransaction"
  | "Sold"
  | "Expired"
  | "Rejected";

export type TradeMethod = "meet" | "ship" | "consignment";
export type ConditionType = "New" | "LikeNew" | "Used" | "Worn";

/** Seller thu gọn khi populate từ BE (searchListings/populate) */
export interface SellerRef {
  _id: string;
  fullName?: string;
  email?: string;   // <— bổ sung để FE không phải fetch user riêng
  phone?: string;
  avatar?: string;
}
export type SellerId = string | SellerRef; // <— alias tiện dùng

export interface Listing {
  _id: string;
  /** BE có thể populate -> union để FE không vỡ */
  sellerId: SellerId;

  type: "Car" | "Battery";

  // Chung
  make?: string;
  model?: string;
  year?: number;
  /** optional để khớp BE (BaseListing.condition?) */
  condition?: ConditionType;
  mileageKm?: number;

  // Battery-only
  batteryCapacityKWh?: number;
  chargeCycles?: number;

  // Car-only (theo mẫu hợp đồng – đều optional để không phá UI cũ)
  licensePlate?: string;             // Biển số
  engineDisplacementCc?: number;     // Dung tích xi-lanh (cc)
  vehicleType?: string;              // Sedan/SUV/...
  paintColor?: string;               // Màu sơn
  engineNumber?: string;             // Số máy
  chassisNumber?: string;            // Số khung
  otherFeatures?: string;            // Đặc điểm khác

  photos: Media[];
  documents?: Media[];               // optional
  location?: {
    city?: string;
    district?: string;
    address?: string;
  };

  priceListed: number;
  tradeMethod: TradeMethod;

  status: ListingStatus;
  notes?: string;
  rejectReason?: string;
  publishedAt?: string;              // ISO

  createdAt: string;
  updatedAt: string;
}

/* =========================
 * Transaction / Fee / Stats (giữ nguyên)
 * ========================= */
export interface Transaction {
  id: string;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  product: { id: string; name: string };
  amount: number;
  status: "created" | "paid" | "shipping" | "completed" | "disputed";
  createdAt: string;
  timeline: { status: string; date: string; completed: boolean }[];
}

export interface FeeConfig {
  id: string;
  type: string;
  percentage: number;
  lastUpdated: string;
  updatedBy: string;
}

export interface Stats {
  totalUsers: number;
  totalListings: number;
  revenue: number;
  completedTransactions: number;
  certifiedListings: number;
}

/* =========
 * (Tuỳ chọn) Type guards để admin render theo loại
 * ========= */
export const isCar = (l: Listing): l is Listing & { type: "Car" } => l?.type === "Car";
export const isBattery = (l: Listing): l is Listing & { type: "Battery" } => l?.type === "Battery";

/** (tiện) Kiểm tra seller đã populate chưa */
export const isSellerPopulated = (s: SellerId): s is SellerRef =>
  !!s && typeof s !== "string";

/* =========================
 * (Khuyến nghị) Sort/Filter/Pagination cho trang Admin
 * ========================= */
export type SortBy = "newest" | "oldest" | "price_low" | "price_high" | "reputation";

export interface ListingFilter {
  keyword?: string;
  type?: "Car" | "Battery";
  make?: string;
  model?: string;
  year?: number;
  batteryCapacityKWh?: number;
  mileageKm?: number;         // max mileage
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  district?: string;
  condition?: ConditionType;
  sortBy?: SortBy;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}

/** Map đúng response từ BE public searchListings */
export interface SearchListingsResponse {
  listings: Listing[];
  pagination: PaginationMeta;
  filters: Partial<ListingFilter>;
}

/* =========================
 * (Admin) Actions & response types
 * ========================= */
export type AdminAction =
  | "approve"          // -> Published
  | "reject"           // -> Rejected (kèm rejectReason)
  | "markInTransaction"// -> InTransaction
  | "markSold"         // -> Sold
  | "expire"           // -> Expired
  | "revertToDraft";   // -> Draft

export interface RejectPayload {
  reason: string;
}

/** Map đúng response từ BE admin list: GET /api/admin/listings */
export interface AdminListingsResponse {
  listings: Listing[];
  pagination: PaginationMeta;
}
