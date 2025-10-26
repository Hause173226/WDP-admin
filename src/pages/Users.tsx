import { useState } from 'react';
import Layout from '../components/Layout';
import { Search, Eye, Lock, Unlock, CheckCircle } from 'lucide-react';
import { mockUsers } from '../data/mockData';
import { User } from '../types';

type FilterStatus = 'all' | 'active' | 'pending' | 'blocked';

export default function Users() {
  const [users] = useState<User[]>(mockUsers);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesFilter = filter === 'all' || user.status === filter;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      blocked: 'bg-red-100 text-red-700'
    };
    const labels = {
      active: 'Hoạt động',
      pending: 'Chờ duyệt',
      blocked: 'Bị khóa'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const labels = {
      buyer: 'Người mua',
      seller: 'Người bán',
      both: 'Cả hai'
    };
    return labels[role as keyof typeof labels];
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h1>
          <p className="text-gray-600 mt-1">Quản lý và kiểm duyệt người dùng trên nền tảng</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'active', 'pending', 'blocked'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' && 'Tất cả'}
                  {status === 'active' && 'Hoạt động'}
                  {status === 'pending' && 'Chờ duyệt'}
                  {status === 'blocked' && 'Bị khóa'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Họ tên</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Vai trò</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Trạng thái</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Ngày tạo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">GD</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{user.email}</td>
                    <td className="py-4 px-4 text-gray-600">{getRoleBadge(user.role)}</td>
                    <td className="py-4 px-4">{getStatusBadge(user.status)}</td>
                    <td className="py-4 px-4 text-gray-600">{user.createdAt}</td>
                    <td className="py-4 px-4 text-gray-600">{user.transactionCount}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} className="text-gray-600" />
                        </button>
                        {user.status === 'pending' && (
                          <button
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Phê duyệt"
                          >
                            <CheckCircle size={18} className="text-green-600" />
                          </button>
                        )}
                        {user.status === 'active' && (
                          <button
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Khóa"
                          >
                            <Lock size={18} className="text-red-600" />
                          </button>
                        )}
                        {user.status === 'blocked' && (
                          <button
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mở khóa"
                          >
                            <Unlock size={18} className="text-green-600" />
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

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Chi tiết người dùng</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-2xl">
                    {selectedUser.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  {getStatusBadge(selectedUser.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Vai trò</p>
                  <p className="font-semibold text-gray-900">{getRoleBadge(selectedUser.role)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Số giao dịch</p>
                  <p className="font-semibold text-gray-900">{selectedUser.transactionCount}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Ngày tham gia</p>
                  <p className="font-semibold text-gray-900">{selectedUser.createdAt}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">ID</p>
                  <p className="font-semibold text-gray-900">{selectedUser.id}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
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
