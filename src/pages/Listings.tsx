import { useState } from 'react';
import Layout from '../components/Layout';
import { Search, Eye, CheckCircle, XCircle, Award, Flag } from 'lucide-react';
import { mockListings } from '../data/mockData';
import { Listing } from '../types';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'spam';

export default function Listings() {
  const [listings] = useState<Listing[]>(mockListings);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const filteredListings = listings.filter((listing) => {
    const matchesFilter = filter === 'all' || listing.status === filter;
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      spam: 'bg-gray-100 text-gray-700'
    };
    const labels = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      spam: 'Spam'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'vehicle' ? 'Xe điện' : 'Pin';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Tin đăng</h1>
          <p className="text-gray-600 mt-1">Kiểm duyệt và quản lý tin đăng bán xe điện & pin</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm tin đăng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {(['all', 'pending', 'approved', 'rejected', 'spam'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' && 'Tất cả'}
                  {status === 'pending' && 'Chờ duyệt'}
                  {status === 'approved' && 'Đã duyệt'}
                  {status === 'rejected' && 'Đã từ chối'}
                  {status === 'spam' && 'Spam'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Tiêu đề</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Người đăng</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Loại</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Giá</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Trạng thái</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Ngày đăng</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{listing.title}</span>
                        {listing.isCertified && (
                          <Award size={16} className="text-blue-600" title="Đã kiểm định" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{listing.seller.name}</td>
                    <td className="py-4 px-4 text-gray-600">{getTypeBadge(listing.type)}</td>
                    <td className="py-4 px-4 text-gray-900 font-medium">{formatPrice(listing.price)}</td>
                    <td className="py-4 px-4">{getStatusBadge(listing.status)}</td>
                    <td className="py-4 px-4 text-gray-600">{listing.createdAt}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedListing(listing)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} className="text-gray-600" />
                        </button>
                        {listing.status === 'pending' && (
                          <>
                            <button
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="Duyệt"
                            >
                              <CheckCircle size={18} className="text-green-600" />
                            </button>
                            <button
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Từ chối"
                            >
                              <XCircle size={18} className="text-red-600" />
                            </button>
                          </>
                        )}
                        {listing.status === 'approved' && !listing.isCertified && (
                          <button
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Gắn nhãn kiểm định"
                          >
                            <Award size={18} className="text-blue-600" />
                          </button>
                        )}
                        <button
                          className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Đánh dấu spam"
                        >
                          <Flag size={18} className="text-orange-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Chi tiết tin đăng</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedListing.title}</h4>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedListing.status)}
                      {selectedListing.isCertified && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Award size={14} />
                          Đã kiểm định
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{formatPrice(selectedListing.price)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Loại</p>
                    <p className="font-semibold text-gray-900">{getTypeBadge(selectedListing.type)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Người đăng</p>
                    <p className="font-semibold text-gray-900">{selectedListing.seller.name}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Ngày đăng</p>
                    <p className="font-semibold text-gray-900">{selectedListing.createdAt}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">ID</p>
                    <p className="font-semibold text-gray-900">{selectedListing.id}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Mô tả</h5>
                  <p className="text-gray-600 leading-relaxed">{selectedListing.description}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <div className="flex gap-2">
                {selectedListing.status === 'pending' && (
                  <>
                    <button className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                      Duyệt tin
                    </button>
                    <button className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
                      Từ chối
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedListing(null)}
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
