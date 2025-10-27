import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Search, Eye, Lock, Unlock, Trash2 } from "lucide-react";
import { User } from "../types";
import { usersService } from "../services/api";

type FilterStatus = "all" | "ACTIVE" | "SUSPENDED" | "DELETED";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8081/api/users", {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    setUpdatingStatus(userId);
    try {
      await usersService.updateUserStatus(userId, newStatus);

      // Cập nhật local state
      setUsers(
        users.map((user) =>
          user._id === userId
            ? {
                ...user,
                status: newStatus as "ACTIVE" | "SUSPENDED" | "DELETED",
              }
            : user
        )
      );
      console.log(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update user status:", error);
      alert(
        `Không thể cập nhật trạng thái người dùng: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  const showConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: "danger" | "warning" | "info" = "warning",
    confirmText: string = "Xác nhận",
    cancelText: string = "Hủy"
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
      confirmText,
      cancelText,
    });
  };

  const handleConfirm = () => {
    confirmModal.onConfirm();
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleCancel = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const filteredUsers = users.filter((user) => {
    // Loại bỏ admin users khỏi danh sách hiển thị
    if (user.role === "admin") {
      return false;
    }

    const matchesFilter = filter === "all" || user.status === filter;
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: "bg-green-100 text-green-700",
      SUSPENDED: "bg-yellow-100 text-yellow-700",
      DELETED: "bg-red-100 text-red-700",
    };
    const labels = {
      ACTIVE: "Hoạt động",
      SUSPENDED: "Tạm khóa",
      DELETED: "Đã xóa",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Đang tải...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý Người dùng
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý và kiểm duyệt người dùng trên nền tảng
          </p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">ℹ️ Lưu ý:</span> Tài khoản quản trị
              viên đã được ẩn khỏi danh sách để bảo mật hệ thống.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {(
                ["all", "ACTIVE", "SUSPENDED", "DELETED"] as FilterStatus[]
              ).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status === "all" && "Tất cả"}
                  {status === "ACTIVE" && "Hoạt động"}
                  {status === "SUSPENDED" && "Tạm khóa"}
                  {status === "DELETED" && "Đã xóa"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Họ tên
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Số điện thoại
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Vai trò
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Trạng thái
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Ngày tạo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.fullName}
                              className="w-full h-full rounded-full"
                            />
                          ) : (
                            <span className="text-blue-600 font-medium text-sm">
                              {user.fullName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {user.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{user.email}</td>
                    <td className="py-4 px-4 text-gray-600">{user.phone}</td>
                    <td className="py-4 px-4 text-gray-600">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : user.role === "staff"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role === "admin"
                          ? "Quản trị viên"
                          : user.role === "staff"
                          ? "Nhân viên"
                          : "Người dùng"}
                      </span>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(user.status)}</td>
                    <td className="py-4 px-4 text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} className="text-gray-600" />
                        </button>

                        {user.status === "ACTIVE" && (
                          <button
                            onClick={() =>
                              updateUserStatus(user._id, "SUSPENDED")
                            }
                            disabled={updatingStatus === user._id}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Tạm khóa"
                          >
                            <Lock size={18} className="text-red-600" />
                          </button>
                        )}
                        {user.status === "SUSPENDED" && (
                          <button
                            onClick={() => updateUserStatus(user._id, "ACTIVE")}
                            disabled={updatingStatus === user._id}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Kích hoạt"
                          >
                            <Unlock size={18} className="text-green-600" />
                          </button>
                        )}
                        {user.status === "ACTIVE" && (
                          <button
                            onClick={() =>
                              showConfirmModal(
                                "Xóa người dùng",
                                `Bạn có chắc chắn muốn xóa người dùng "${user.fullName}"? Hành động này không thể hoàn tác.`,
                                () => updateUserStatus(user._id, "DELETED"),
                                "danger",
                                "Xóa",
                                "Hủy"
                              )
                            }
                            disabled={updatingStatus === user._id}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Xóa"
                          >
                            <Trash2 size={18} className="text-red-600" />
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
              <h3 className="text-xl font-bold text-gray-900">
                Chi tiết người dùng
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.fullName}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <span className="text-blue-600 font-bold text-2xl">
                      {selectedUser.fullName.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedUser.fullName}
                  </h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  {getStatusBadge(selectedUser.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Vai trò</p>
                  <p className="font-semibold text-gray-900">
                    {selectedUser.role === "admin"
                      ? "Quản trị viên"
                      : selectedUser.role === "staff"
                      ? "Nhân viên"
                      : "Người dùng"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Số điện thoại</p>
                  <p className="font-semibold text-gray-900">
                    {selectedUser.phone}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">Ngày tham gia</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">
                    Email đã xác minh
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedUser.emailVerified
                      ? "✓ Đã xác minh"
                      : "✗ Chưa xác minh"}
                  </p>
                </div>
                {selectedUser.stats && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">
                        Số sản phẩm đã bán
                      </p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.stats.soldCount}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">
                        Số sản phẩm đã mua
                      </p>
                      <p className="font-semibold text-gray-900">
                        {selectedUser.stats.buyCount}
                      </p>
                    </div>
                  </>
                )}
                {selectedUser.address && (
                  <div className="bg-gray-50 p-4 rounded-xl col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Địa chỉ</p>
                    <p className="font-semibold text-gray-900">
                      {selectedUser.address.fullAddress},{" "}
                      {selectedUser.address.ward},{" "}
                      {selectedUser.address.district},{" "}
                      {selectedUser.address.city}
                    </p>
                  </div>
                )}
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

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    confirmModal.type === "danger"
                      ? "bg-red-100"
                      : confirmModal.type === "warning"
                      ? "bg-yellow-100"
                      : "bg-blue-100"
                  }`}
                >
                  {confirmModal.type === "danger" ? (
                    <Trash2 size={24} className="text-red-600" />
                  ) : confirmModal.type === "warning" ? (
                    <Lock size={24} className="text-yellow-600" />
                  ) : (
                    <Unlock size={24} className="text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {confirmModal.title}
                  </h3>
                </div>
              </div>

              <p className="text-gray-600 mb-6">{confirmModal.message}</p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {confirmModal.cancelText || "Hủy"}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    confirmModal.type === "danger"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : confirmModal.type === "warning"
                      ? "bg-yellow-600 text-white hover:bg-yellow-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {confirmModal.confirmText || "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
