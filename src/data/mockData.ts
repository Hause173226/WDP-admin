import { User, Listing, Transaction, FeeConfig, Stats } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@email.com',
    role: 'seller',
    status: 'active',
    createdAt: '2024-01-15',
    transactionCount: 12
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    email: 'binh.tran@email.com',
    role: 'buyer',
    status: 'active',
    createdAt: '2024-02-20',
    transactionCount: 5
  },
  {
    id: '3',
    name: 'Lê Minh Cường',
    email: 'cuong.le@email.com',
    role: 'both',
    status: 'pending',
    createdAt: '2024-03-10',
    transactionCount: 0
  },
  {
    id: '4',
    name: 'Phạm Thu Dung',
    email: 'dung.pham@email.com',
    role: 'seller',
    status: 'blocked',
    createdAt: '2024-01-05',
    transactionCount: 3
  }
];

export const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Xe máy điện VinFast Klara S 2023',
    type: 'vehicle',
    price: 35000000,
    seller: { id: '1', name: 'Nguyễn Văn An' },
    status: 'pending',
    isCertified: false,
    images: [],
    description: 'Xe còn mới 95%, đi 2000km, pin zin',
    createdAt: '2024-03-15'
  },
  {
    id: '2',
    title: 'Pin lithium 48V 20Ah',
    type: 'battery',
    price: 8500000,
    seller: { id: '1', name: 'Nguyễn Văn An' },
    status: 'approved',
    isCertified: true,
    images: [],
    description: 'Pin còn 90% dung lượng, bảo hành 6 tháng',
    createdAt: '2024-03-10'
  },
  {
    id: '3',
    title: 'Xe đạp điện Giant 2022',
    type: 'vehicle',
    price: 12000000,
    seller: { id: '4', name: 'Phạm Thu Dung' },
    status: 'rejected',
    isCertified: false,
    images: [],
    description: 'Xe cũ, cần sửa chữa',
    createdAt: '2024-03-12'
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 'TXN001',
    buyer: { id: '2', name: 'Trần Thị Bình' },
    seller: { id: '1', name: 'Nguyễn Văn An' },
    product: { id: '2', name: 'Pin lithium 48V 20Ah' },
    amount: 8500000,
    status: 'completed',
    createdAt: '2024-03-01',
    timeline: [
      { status: 'Tạo đơn', date: '2024-03-01', completed: true },
      { status: 'Thanh toán', date: '2024-03-01', completed: true },
      { status: 'Giao hàng', date: '2024-03-03', completed: true },
      { status: 'Hoàn tất', date: '2024-03-05', completed: true }
    ]
  },
  {
    id: 'TXN002',
    buyer: { id: '3', name: 'Lê Minh Cường' },
    seller: { id: '1', name: 'Nguyễn Văn An' },
    product: { id: '1', name: 'Xe máy điện VinFast Klara S' },
    amount: 35000000,
    status: 'shipping',
    createdAt: '2024-03-12',
    timeline: [
      { status: 'Tạo đơn', date: '2024-03-12', completed: true },
      { status: 'Thanh toán', date: '2024-03-12', completed: true },
      { status: 'Giao hàng', date: '2024-03-14', completed: true },
      { status: 'Hoàn tất', date: '', completed: false }
    ]
  },
  {
    id: 'TXN003',
    buyer: { id: '2', name: 'Trần Thị Bình' },
    seller: { id: '4', name: 'Phạm Thu Dung' },
    product: { id: '3', name: 'Xe đạp điện Giant' },
    amount: 12000000,
    status: 'disputed',
    createdAt: '2024-03-10',
    timeline: [
      { status: 'Tạo đơn', date: '2024-03-10', completed: true },
      { status: 'Thanh toán', date: '2024-03-10', completed: true },
      { status: 'Giao hàng', date: '2024-03-11', completed: true },
      { status: 'Hoàn tất', date: '', completed: false }
    ]
  }
];

export const mockFees: FeeConfig[] = [
  {
    id: '1',
    type: 'Phí giao dịch xe điện',
    percentage: 5,
    lastUpdated: '2024-01-01',
    updatedBy: 'Admin'
  },
  {
    id: '2',
    type: 'Phí giao dịch pin',
    percentage: 3,
    lastUpdated: '2024-01-01',
    updatedBy: 'Admin'
  },
  {
    id: '3',
    type: 'Phí kiểm định',
    percentage: 2,
    lastUpdated: '2024-02-15',
    updatedBy: 'Admin'
  }
];

export const mockStats: Stats = {
  totalUsers: 1234,
  totalListings: 456,
  revenue: 125000000,
  completedTransactions: 89,
  certifiedListings: 234
};

export const mockRevenueData = [
  { date: '01/03', revenue: 12000000 },
  { date: '05/03', revenue: 18000000 },
  { date: '10/03', revenue: 15000000 },
  { date: '15/03', revenue: 22000000 },
  { date: '20/03', revenue: 28000000 },
  { date: '25/03', revenue: 30000000 }
];
