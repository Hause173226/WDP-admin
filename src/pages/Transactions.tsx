import { useState } from 'react';
import Layout from '../components/Layout';
import { Eye, Download, AlertCircle } from 'lucide-react';
import { mockTransactions } from '../data/mockData';
import { Transaction } from '../types';

export default function Transactions() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const getStatusBadge = (status: string) => {
    const styles = {
      created: 'bg-gray-100 text-gray-700',
      paid: 'bg-blue-100 text-blue-700',
      shipping: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      disputed: 'bg-red-100 text-red-700'
    };
    const labels = {
      created: 'Đã tạo',
      paid: 'Đã thanh toán',
      shipping: 'Đang giao',
      completed: 'Hoàn tất',
      disputed: 'Khiếu nại'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;
  const processingTransactions = transactions.filter(t => ['paid', 'shipping'].includes(t.status)).length;
  const disputedTransactions = transactions.filter(t => t.status === 'disputed').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Giao dịch</h1>
          <p className="text-gray-600 mt-1">Theo dõi và xử lý các giao dịch trên nền tảng</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Tổng giao dịch</p>
            <p className="text-3xl font-bold text-gray-900">{totalTransactions}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Đã hoàn tất</p>
            <p className="text-3xl font-bold text-green-600">{completedTransactions}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Đang xử lý</p>
            <p className="text-3xl font-bold text-yellow-600">{processingTransactions}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Khiếu nại</p>
            <p className="text-3xl font-bold text-red-600">{disputedTransactions}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách giao dịch</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <Download size={18} />
              Xuất CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Mã GD</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Người mua</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Người bán</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Sản phẩm</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Số tiền</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Trạng thái</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Ngày</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{transaction.id}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{transaction.buyer.name}</td>
                    <td className="py-4 px-4 text-gray-600">{transaction.seller.name}</td>
                    <td className="py-4 px-4 text-gray-600">{transaction.product.name}</td>
                    <td className="py-4 px-4 text-gray-900 font-medium">{formatPrice(transaction.amount)}</td>
                    <td className="py-4 px-4">{getStatusBadge(transaction.status)}</td>
                    <td className="py-4 px-4 text-gray-600">{transaction.createdAt}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} className="text-gray-600" />
                        </button>
                        {transaction.status === 'disputed' && (
                          <button
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xử lý khiếu nại"
                          >
                            <AlertCircle size={18} className="text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Chi tiết giao dịch</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mã giao dịch</p>
                  <p className="text-xl font-bold text-gray-900">{selectedTransaction.id}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Người mua</p>
                  <p className="font-semibold text-gray-900">{selectedTransaction.buyer.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Người bán</p>
                  <p className="font-semibold text-gray-900">{selectedTransaction.seller.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Sản phẩm</p>
                  <p className="font-semibold text-gray-900">{selectedTransaction.product.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Số tiền</p>
                  <p className="font-semibold text-blue-600 text-lg">{formatPrice(selectedTransaction.amount)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
                  <p className="font-semibold text-gray-900">{selectedTransaction.createdAt}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Tiến trình giao dịch</h4>
                <div className="space-y-4">
                  {selectedTransaction.timeline.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            step.completed ? 'bg-green-100' : 'bg-gray-100'
                          }`}
                        >
                          {step.completed ? (
                            <svg
                              className="w-5 h-5 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                        {index < selectedTransaction.timeline.length - 1 && (
                          <div
                            className={`absolute left-5 top-10 w-0.5 h-12 ${
                              step.completed ? 'bg-green-200' : 'bg-gray-200'
                            }`}
                          ></div>
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <p className="font-medium text-gray-900">{step.status}</p>
                        {step.date && (
                          <p className="text-sm text-gray-600 mt-1">{step.date}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTransaction.status === 'disputed' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 mt-0.5" size={20} />
                    <div>
                      <h5 className="font-semibold text-red-900 mb-1">Giao dịch đang có khiếu nại</h5>
                      <p className="text-sm text-red-700">
                        Cần xem xét và xử lý khiếu nại từ người mua hoặc người bán.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
