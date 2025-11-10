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
  // Additional fields for Car type
  licensePlate?: string;
  engineDisplacementCc?: number;
  vehicleType?: string;
  paintColor?: string;
  engineNumber?: string;
  chassisNumber?: string;
  otherFeatures?: string;
}

export interface Transaction {
  id: string;
  type: "buyer" | "seller";
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REJECTED" | "COMPLETED";
  listing: {
    id: string;
    title: string;
    make?: string;
    model?: string;
    year?: number;
    priceListed: number;
    images: string[];
  };
  depositRequest: {
    id: string;
    depositAmount: number;
    status:
      | "PENDING_SELLER_CONFIRMATION"
      | "IN_ESCROW"
      | "CANCELLED"
      | "UNKNOWN";
  };
  counterparty: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  dates: {
    createdAt: string;
    scheduledDate: string;
    cancelledAt?: string;
    completedAt?: string;
  };
  amount: {
    deposit: number;
    total: number;
  };
  appointmentId: string;
  contract?: {
    id: string;
    status: string;
    contractNumber: string;
    photos: {
      url: string;
      publicId: string;
      uploadedAt: string;
    }[];
    signedAt: string;
    completedAt?: string;
  };
}

export interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface TransactionDetailResponse {
  success: boolean;
  data: {
    appointment?: {
      _id: string;
      auctionId?: string;
      appointmentType?: string;
      buyerId?: {
        _id: string;
        fullName: string;
        phone: string;
        email: string;
      };
      sellerId?: {
        _id: string;
        fullName: string;
        phone: string;
        email: string;
      };
      scheduledDate: string;
      status: string;
      type?: string;
      location?: string;
      notes?: string;
      buyerConfirmed?: boolean;
      sellerConfirmed?: boolean;
      createdAt: string;
      updatedAt: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contract?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listing?: any;
  };
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

export interface SystemWallet {
  id: string;
  balance: number;
  totalEarned: number;
  totalTransactions: number;
  lastTransactionAt: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalRevenue: number;
    totalFees: number;
  };
}

export interface SystemWalletResponse {
  success: boolean;
  data: SystemWallet;
}
