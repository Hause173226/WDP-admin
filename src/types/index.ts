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

export interface Media {
  url: string;
  kind: "photo" | "doc";
}

export interface Listing {
  _id: string;
  sellerId: string;
  type: "Car" | "Battery";
  make?: string;
  model?: string;
  year?: number;
  batteryCapacityKWh?: number;
  mileageKm?: number;
  chargeCycles?: number;
  condition: "New" | "LikeNew" | "Used" | "Worn";
  photos: Media[];
  documents: Media[];
  location: {
    city?: string;
    district?: string;
    address?: string;
  };
  priceListed: number;
  tradeMethod: "meet" | "ship" | "consignment";
  status:
    | "Draft"
    | "PendingReview"
    | "Published"
    | "InTransaction"
    | "Sold"
    | "Expired"
    | "Rejected";
  notes?: string;
  rejectReason?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  buyer: {
    id: string;
    name: string;
  };
  seller: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
  };
  amount: number;
  status: "created" | "paid" | "shipping" | "completed" | "disputed";
  createdAt: string;
  timeline: {
    status: string;
    date: string;
    completed: boolean;
  }[];
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
