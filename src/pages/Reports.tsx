import { useState } from 'react';
import Layout from '../components/Layout';
import { Download, TrendingUp } from 'lucide-react';
import { mockStats, mockRevenueData } from '../data/mockData';

type TimeFilter = '7days' | '30days' | 'year';
type ExportFormat = 'csv' | 'pdf';

export default function Reports() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');
  const [showExportModal, setShowExportModal] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const handleExport = (format: ExportFormat) => {
    alert(`Đang xuất báo cáo định dạng ${format.toUpperCase()}...`);
    setShowExportModal(false);
  };

  const transactionStats = [
    { status: 'Hoàn tất', count: 156, percentage: 65, color: 'bg-green-600' },
    { status: 'Đang xử lý', count: 48, percentage: 20, color: 'bg-yellow-600' },
    { status: 'Đã hủy', count: 24, percentage: 10, color: 'bg-red-600' },
    { status: 'Khiếu nại', count: 12, percentage: 5, color: 'bg-orange-600' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thống kê & Báo cáo</h1>
            <p className="text-gray-600 mt-1">Phân tích chi tiết về hoạt động nền tảng</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            Xuất báo cáo
          </button>
        </div>

        <div className="flex gap-2">
          {(['7days', '30days', 'year'] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {filter === '7days' && '7 ngày qua'}
              {filter === '30days' && '30 ngày qua'}
              {filter === 'year' && 'Năm nay'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Người dùng</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{formatNumber(mockStats.totalUsers)}</p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />
              <span>+12%</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Tin đăng</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{formatNumber(mockStats.totalListings)}</p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />
              <span>+8%</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Doanh thu</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">{formatPrice(mockStats.revenue)}</p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />
              <span>+15%</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">GD thành công</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{formatNumber(mockStats.completedTransactions)}</p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />
              <span>+5%</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Tin kiểm định</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{formatNumber(mockStats.certifiedListings)}</p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />
              <span>+10%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Biểu đồ doanh thu</h2>
          <div className="h-80 flex items-end justify-between gap-3">
            {mockRevenueData.map((data, index) => {
              const maxRevenue = Math.max(...mockRevenueData.map(d => d.revenue));
              const height = (data.revenue / maxRevenue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full bg-gray-100 rounded-t-xl relative group cursor-pointer hover:bg-blue-50 transition-colors" style={{ height: `${height}%`, minHeight: '40px' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl"></div>
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                      <div className="font-semibold">{formatPrice(data.revenue)}</div>
                      <div className="text-xs text-gray-300">{data.date}</div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">{data.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Tỷ lệ trạng thái giao dịch</h2>
          <div className="space-y-4">
            {transactionStats.map((stat, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">{stat.status}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">{stat.count} giao dịch</span>
                    <span className="text-gray-900 font-semibold">{stat.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`${stat.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Giao dịch gần nhất</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Mã GD</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Sản phẩm</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Người mua</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Số tiền</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Ngày</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-900">TXN001</td>
                  <td className="py-4 px-4 text-gray-600">Pin lithium 48V 20Ah</td>
                  <td className="py-4 px-4 text-gray-600">Trần Thị Bình</td>
                  <td className="py-4 px-4 text-gray-900 font-medium">{formatPrice(8500000)}</td>
                  <td className="py-4 px-4 text-gray-600">2024-03-01</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Hoàn tất
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-900">TXN002</td>
                  <td className="py-4 px-4 text-gray-600">Xe máy điện VinFast Klara S</td>
                  <td className="py-4 px-4 text-gray-600">Lê Minh Cường</td>
                  <td className="py-4 px-4 text-gray-900 font-medium">{formatPrice(35000000)}</td>
                  <td className="py-4 px-4 text-gray-600">2024-03-12</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      Đang giao
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-900">TXN003</td>
                  <td className="py-4 px-4 text-gray-600">Xe đạp điện Giant</td>
                  <td className="py-4 px-4 text-gray-600">Trần Thị Bình</td>
                  <td className="py-4 px-4 text-gray-900 font-medium">{formatPrice(12000000)}</td>
                  <td className="py-4 px-4 text-gray-600">2024-03-10</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      Khiếu nại
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Xuất báo cáo</h3>
            <p className="text-gray-600 mb-6">Chọn định dạng file để xuất báo cáo</p>
            <div className="space-y-3">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                Xuất file CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Xuất file PDF
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
