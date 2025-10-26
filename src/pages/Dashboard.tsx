import Layout from '../components/Layout';
import { Users, FileText, DollarSign, CheckCircle, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { mockStats, mockRevenueData, mockTransactions } from '../data/mockData';
import { useState } from 'react';

type TimeFilter = '7days' | '30days' | 'year';

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const stats = [
    {
      icon: Users,
      label: 'Người dùng',
      value: formatNumber(mockStats.totalUsers),
      change: '+12%',
      isPositive: true,
      color: 'blue'
    },
    {
      icon: FileText,
      label: 'Tin đăng',
      value: formatNumber(mockStats.totalListings),
      change: '+8%',
      isPositive: true,
      color: 'green'
    },
    {
      icon: DollarSign,
      label: 'Doanh thu',
      value: formatPrice(mockStats.revenue),
      change: '+15%',
      isPositive: true,
      color: 'purple'
    },
    {
      icon: CheckCircle,
      label: 'GD thành công',
      value: formatNumber(mockStats.completedTransactions),
      change: '+5%',
      isPositive: true,
      color: 'orange'
    }
  ];

  const listingTypes = [
    { name: 'Xe điện', value: 65, color: 'bg-blue-600' },
    { name: 'Pin', value: 35, color: 'bg-green-600' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
          <p className="text-gray-600 mt-1">Thống kê và báo cáo về hoạt động nền tảng</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon className={`text-${stat.color}-600`} size={24} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Doanh thu theo thời gian</h2>
              <div className="flex gap-2">
                {(['7days', '30days', 'year'] as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      timeFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter === '7days' && '7 ngày'}
                    {filter === '30days' && '30 ngày'}
                    {filter === 'year' && 'Năm nay'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {mockRevenueData.map((data, index) => {
                const maxRevenue = Math.max(...mockRevenueData.map(d => d.revenue));
                const height = (data.revenue / maxRevenue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-100 rounded-t-lg relative group cursor-pointer hover:bg-blue-50 transition-colors" style={{ height: `${height}%` }}>
                      <div className="absolute inset-0 bg-blue-600 rounded-t-lg" style={{ height: '100%' }}></div>
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {formatPrice(data.revenue)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">{data.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Loại tin đăng</h2>
            <div className="space-y-6">
              <div className="relative w-48 h-48 mx-auto">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="20"
                    strokeDasharray={`${listingTypes[0].value * 2.51} ${(100 - listingTypes[0].value) * 2.51}`}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="20"
                    strokeDasharray={`${listingTypes[1].value * 2.51} ${(100 - listingTypes[1].value) * 2.51}`}
                    strokeDashoffset={`${-listingTypes[0].value * 2.51}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{mockStats.totalListings}</p>
                    <p className="text-sm text-gray-600">Tổng tin</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {listingTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${type.color}`}></div>
                      <span className="text-gray-700">{type.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{type.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Giao dịch gần nhất</h2>
            <div className="space-y-4">
              {mockTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.product.name}</p>
                    <p className="text-sm text-gray-600">{transaction.buyer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPrice(transaction.amount)}</p>
                    <p className="text-xs text-gray-600">{transaction.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Tin đã kiểm định</h2>
            </div>
            <div className="text-center py-8">
              <div className="inline-flex w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Award className="text-blue-600" size={48} />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{mockStats.certifiedListings}</p>
              <p className="text-gray-600">Tin đăng đã được kiểm định chất lượng</p>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tỷ lệ kiểm định</span>
                  <span className="font-semibold text-blue-600">
                    {Math.round((mockStats.certifiedListings / mockStats.totalListings) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
