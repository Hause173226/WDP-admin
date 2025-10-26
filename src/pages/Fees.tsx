import { useState } from 'react';
import Layout from '../components/Layout';
import { Save, History } from 'lucide-react';
import { mockFees } from '../data/mockData';
import { FeeConfig } from '../types';

export default function Fees() {
  const [fees, setFees] = useState<FeeConfig[]>(mockFees);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdateFee = (id: string, newPercentage: number) => {
    setFees(fees.map(fee =>
      fee.id === id
        ? { ...fee, percentage: newPercentage, lastUpdated: new Date().toISOString().split('T')[0] }
        : fee
    ));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const totalRevenue = 125000000;
  const totalFeesCollected = 6250000;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Phí & Hoa hồng</h1>
          <p className="text-gray-600 mt-1">Thiết lập và quản lý phí dịch vụ trên nền tảng</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Tổng doanh thu</p>
            <p className="text-3xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Tổng phí thu được</p>
            <p className="text-3xl font-bold text-blue-600">{formatPrice(totalFeesCollected)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Cấu hình phí</h2>
          <div className="space-y-4">
            {fees.map((fee) => (
              <div key={fee.id} className="border border-gray-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{fee.type}</h3>
                    <p className="text-sm text-gray-600">
                      Cập nhật lần cuối: {fee.lastUpdated} bởi {fee.updatedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={fee.percentage}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            setFees(fees.map(f => f.id === fee.id ? { ...f, percentage: value } : f));
                          }
                        }}
                        className="w-24 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-600 font-medium">%</span>
                    </div>
                    <button
                      onClick={() => handleUpdateFee(fee.id, fee.percentage)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Save size={18} />
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <History size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Lịch sử cập nhật</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Ngày</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Loại phí</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Mức cũ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Mức mới</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Người cập nhật</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-gray-600">2024-02-15</td>
                  <td className="py-4 px-4 text-gray-900">Phí kiểm định</td>
                  <td className="py-4 px-4 text-gray-600">1.5%</td>
                  <td className="py-4 px-4 text-green-600 font-medium">2%</td>
                  <td className="py-4 px-4 text-gray-600">Admin</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-gray-600">2024-01-10</td>
                  <td className="py-4 px-4 text-gray-900">Phí giao dịch xe điện</td>
                  <td className="py-4 px-4 text-gray-600">4%</td>
                  <td className="py-4 px-4 text-green-600 font-medium">5%</td>
                  <td className="py-4 px-4 text-gray-600">Admin</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4 text-gray-600">2024-01-01</td>
                  <td className="py-4 px-4 text-gray-900">Phí giao dịch pin</td>
                  <td className="py-4 px-4 text-gray-600">2.5%</td>
                  <td className="py-4 px-4 text-green-600 font-medium">3%</td>
                  <td className="py-4 px-4 text-gray-600">Admin</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fadeIn">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Cập nhật thành công!</span>
        </div>
      )}
    </Layout>
  );
}
