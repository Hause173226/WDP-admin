/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, memo, useCallback, useRef } from "react";
import Layout from "../components/Layout";
import { Search, Eye, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Listing } from "../types";
import { listingsService, usersService } from "../services/api";

type FilterStatus = "PendingReview" | "Published" | "Rejected";

export default function Listings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("PendingReview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [users, setUsers] = useState<{
    [key: string]: { fullName: string; email: string };
  }>({});

  // Ref để track API calls (compatible với StrictMode)
  const fetchingUsersRef = useRef<Set<string>>(new Set());
  const apiCallsRef = useRef<
    Map<string, Promise<{ fullName: string; email: string }>>
  >(new Map());

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await listingsService.getPendingListings();
      setListings(Array.isArray(data) ? data : data.listings || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    // Filter theo status
    const matchesFilter = listing.status === filter;
    // Filter theo search
    const matchesSearch =
      listing.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      PendingReview: "bg-yellow-100 text-yellow-700",
      Published: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
      Draft: "bg-gray-100 text-gray-700",
      InTransaction: "bg-blue-100 text-blue-700",
      Sold: "bg-purple-100 text-purple-700",
      Expired: "bg-orange-100 text-orange-700",
    };
    const labels = {
      PendingReview: "Chờ duyệt",
      Published: "Đã duyệt",
      Rejected: "Từ chối",
      Draft: "Bản nháp",
      InTransaction: "Đang giao dịch",
      Sold: "Đã bán",
      Expired: "Hết hạn",
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

  const getTypeBadge = (type: string) => {
    return type === "Car" ? "Xe điện" : "Pin";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatSellerId = (sellerId: string | object | undefined) => {
    if (typeof sellerId === "string") {
      return sellerId;
    }
    if (sellerId && typeof sellerId === "object") {
      return (
        (sellerId as { _id?: string; id?: string })._id ||
        (sellerId as { _id?: string; id?: string }).id ||
        "N/A"
      );
    }
    return "N/A";
  };

  // Memoized SellerInfo component để tránh re-render không cần thiết
  const SellerInfo = memo(
    ({ sellerId }: { sellerId: string | object | undefined }) => {
      const userId = formatSellerId(sellerId);

      // Sử dụng global cache trực tiếp thay vì local state
      const userInfo = users[userId];
      const isLoading = fetchingUsersRef.current.has(userId);

      useEffect(() => {
        const loadUserInfo = async () => {
          if (userId === "N/A") {
            return;
          }

          if (users[userId]) {
            return;
          }

          // Tránh duplicate calls - kiểm tra global cache
          if (fetchingUsersRef.current.has(userId)) {
            return;
          }

          try {
            await fetchUserInfo(userId);
          } catch (error) {
            console.error("Error loading user info:", error);
          }
        };

        loadUserInfo();
      }, [userId]);

      if (isLoading) {
        return <span className="text-gray-400">Đang tải...</span>;
      }

      return (
        <div>
          <div className="font-medium">{userInfo?.fullName || "N/A"}</div>
          <div className="text-xs text-gray-500">{userInfo?.email || ""}</div>
        </div>
      );
    }
  );

  const fetchUserInfo = useCallback(
    async (userId: string) => {
      // Kiểm tra cache trước
      if (users[userId]) {
        console.log(`✅ Cache hit for: ${userId}`);
        return users[userId];
      }

      // Kiểm tra xem đã có request đang chạy chưa (sử dụng ref)
      if (fetchingUsersRef.current.has(userId)) {
        // Trả về promise đang chạy
        return (
          apiCallsRef.current.get(userId) ||
          Promise.resolve({ fullName: "N/A", email: "N/A" })
        );
      }

      // Tạo promise cho API call
      const apiPromise = (async () => {
        try {
          const userData = await usersService.getUserById(userId);
          const userInfo = {
            fullName: userData.fullName || "N/A",
            email: userData.email || "N/A",
          };
          setUsers((prev) => ({ ...prev, [userId]: userInfo }));

          return userInfo;
        } catch (error) {
          return { fullName: "N/A", email: "N/A" };
        } finally {
          // Xóa khỏi refs
          fetchingUsersRef.current.delete(userId);
          apiCallsRef.current.delete(userId);
        }
      })();

      // Lưu promise vào ref
      apiCallsRef.current.set(userId, apiPromise);
      fetchingUsersRef.current.add(userId);

      return apiPromise;
    },
    [users]
  );

  const approveListing = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      const data = await listingsService.approveListing(listingId);

      // Cập nhật local state
      setListings(
        listings.map((listing) =>
          listing._id === listingId
            ? { ...listing, status: "Published" as const }
            : listing
        )
      );

      // Đóng modal
      setSelectedListing(null);

      // Refresh data để đảm bảo sync
      fetchListings();
    } catch (error) {
      console.error("Error approving listing:", error);
      setError(
        error instanceof Error ? error.message : "Lỗi khi duyệt tin đăng"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const rejectListing = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      const data = await listingsService.rejectListing(listingId);
      console.log("Listing rejected:", data.message);

      // Cập nhật local state
      setListings(
        listings.map((listing) =>
          listing._id === listingId
            ? { ...listing, status: "Rejected" as const }
            : listing
        )
      );

      // Đóng modal
      setSelectedListing(null);

      // Refresh data để đảm bảo sync
      fetchListings();
    } catch (error) {
      console.error("Error rejecting listing:", error);
      setError(
        error instanceof Error ? error.message : "Lỗi khi từ chối tin đăng"
      );
    } finally {
      setActionLoading(null);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Tin đăng</h1>
          <p className="text-gray-600 mt-1">
            Kiểm duyệt và quản lý tin đăng bán xe điện & pin
          </p>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <span className="font-medium">⚠️ Lỗi:</span> {error}
              </p>
            </div>
          )}
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
                placeholder="Tìm kiếm tin đăng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {(
                ["PendingReview", "Published", "Rejected"] as FilterStatus[]
              ).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status === "PendingReview" && "Chờ duyệt"}
                  {status === "Published" && "Đã duyệt"}
                  {status === "Rejected" && "Đã từ chối"}
                </button>
              ))}
              <button
                onClick={fetchListings}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Tiêu đề
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Người đăng
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Loại
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Giá
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Trạng thái
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Ngày đăng
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr
                    key={listing._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {listing.photos && listing.photos.length > 0 && (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={`http://localhost:8081${listing.photos[0].url}`}
                              alt={listing.make}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900">
                            {listing.make} {listing.model}{" "}
                            {listing.year && `(${listing.year})`}
                          </span>
                          <div className="text-sm text-gray-500">
                            {listing.location.city &&
                              `${listing.location.city}`}
                            {listing.location.district &&
                              `, ${listing.location.district}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      <div className="text-sm">
                        <SellerInfo sellerId={listing.sellerId} />
                        <div className="text-gray-500 mt-1">
                          {listing.tradeMethod === "meet"
                            ? "Gặp mặt"
                            : listing.tradeMethod === "ship"
                            ? "Giao hàng"
                            : "Ủy thác"}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {getTypeBadge(listing.type)}
                    </td>
                    <td className="py-4 px-4 text-gray-900 font-medium">
                      {formatPrice(listing.priceListed)}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(listing.status)}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {formatDate(listing.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedListing(listing)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} className="text-gray-600" />
                        </button>
                        {/* Chỉ hiển thị action buttons cho listings PendingReview */}
                        {listing.status === "PendingReview" && (
                          <>
                            <button
                              onClick={() => approveListing(listing._id)}
                              disabled={actionLoading === listing._id}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Duyệt"
                            >
                              <CheckCircle
                                size={18}
                                className="text-green-600"
                              />
                            </button>
                            <button
                              onClick={() => rejectListing(listing._id)}
                              disabled={actionLoading === listing._id}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Từ chối"
                            >
                              <XCircle size={18} className="text-red-600" />
                            </button>
                          </>
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

      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Chi tiết tin đăng
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedListing.make} {selectedListing.model}{" "}
                      {selectedListing.year && `(${selectedListing.year})`}
                    </h4>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedListing.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">
                      {formatPrice(selectedListing.priceListed)}
                    </p>
                  </div>
                </div>

                {/* Photos */}
                {selectedListing.photos &&
                  selectedListing.photos.length > 0 && (
                    <div className="mb-6">
                      <h5 className="font-semibold text-gray-900 mb-3">
                        Hình ảnh
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedListing.photos.map((photo, index) => (
                          <div
                            key={index}
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                          >
                            <img
                              src={`http://localhost:8081${photo.url}`}
                              alt={`${selectedListing.make} ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Loại</p>
                    <p className="font-semibold text-gray-900">
                      {getTypeBadge(selectedListing.type)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Tình trạng</p>
                    <p className="font-semibold text-gray-900">
                      {selectedListing.condition === "New"
                        ? "Mới"
                        : selectedListing.condition === "LikeNew"
                        ? "Như mới"
                        : selectedListing.condition === "Used"
                        ? "Đã sử dụng"
                        : "Cũ"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Người đăng</p>
                    <SellerInfo sellerId={selectedListing.sellerId} />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">
                      Phương thức giao dịch
                    </p>
                    <p className="font-semibold text-gray-900">
                      {selectedListing.tradeMethod === "meet"
                        ? "Gặp mặt"
                        : selectedListing.tradeMethod === "ship"
                        ? "Giao hàng"
                        : "Ủy thác"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Ngày đăng</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(selectedListing.createdAt)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">ID</p>
                    <p className="font-semibold text-gray-900">
                      {selectedListing._id}
                    </p>
                  </div>
                </div>

                {/* Thông tin chi tiết theo loại */}
                {selectedListing.type === "Car" && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {selectedListing.mileageKm && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">
                          Số km đã đi
                        </p>
                        <p className="font-semibold text-gray-900">
                          {selectedListing.mileageKm.toLocaleString()} km
                        </p>
                      </div>
                    )}
                    {selectedListing.batteryCapacityKWh && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">
                          Dung lượng pin
                        </p>
                        <p className="font-semibold text-gray-900">
                          {selectedListing.batteryCapacityKWh} kWh
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedListing.type === "Battery" && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {selectedListing.batteryCapacityKWh && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">
                          Dung lượng pin
                        </p>
                        <p className="font-semibold text-gray-900">
                          {selectedListing.batteryCapacityKWh} kWh
                        </p>
                      </div>
                    )}
                    {selectedListing.chargeCycles && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Số lần sạc</p>
                        <p className="font-semibold text-gray-900">
                          {selectedListing.chargeCycles} lần
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Địa chỉ */}
                {selectedListing.location && (
                  <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <p className="text-sm text-gray-600 mb-1">Địa chỉ</p>
                    <p className="font-semibold text-gray-900">
                      {selectedListing.location.address &&
                        `${selectedListing.location.address}, `}
                      {selectedListing.location.district &&
                        `${selectedListing.location.district}, `}
                      {selectedListing.location.city}
                    </p>
                  </div>
                )}

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Mô tả</h5>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedListing.notes || "Không có mô tả"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <div className="flex gap-2">
                {/* Chỉ hiển thị action buttons cho listings PendingReview */}
                {selectedListing.status === "PendingReview" && (
                  <>
                    <button
                      onClick={() => approveListing(selectedListing._id)}
                      disabled={actionLoading === selectedListing._id}
                      className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === selectedListing._id
                        ? "Đang xử lý..."
                        : "Duyệt tin"}
                    </button>
                    <button
                      onClick={() => rejectListing(selectedListing._id)}
                      disabled={actionLoading === selectedListing._id}
                      className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === selectedListing._id
                        ? "Đang xử lý..."
                        : "Từ chối"}
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
