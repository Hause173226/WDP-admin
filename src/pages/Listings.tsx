import { useState, useEffect, memo, useCallback, useRef, useMemo } from "react";
import Layout from "../components/Layout";
import { Search, Eye, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Listing } from "../types";
import { listingsService, usersService } from "../services/api";

type FilterStatus = "PendingReview" | "Published" | "Rejected";

type SellerIdUnion =
  | string
  | {
      _id?: string;
      id?: string;
      fullName?: string;
      email?: string;
      avatar?: string;
      phone?: string;
    };

export default function Listings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("PendingReview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [users, setUsers] = useState<
    Record<string, { fullName: string; email: string }>
  >({});

  const fetchingUsersRef = useRef<Set<string>>(new Set());
  const apiCallsRef = useRef<
    Map<string, Promise<{ fullName: string; email: string }>>
  >(new Map());

  const fetchListings = useCallback(async (status: FilterStatus, isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setTableLoading(true);
      }
      setError(null);
      const data = await listingsService.getAdminListings({ status });
      const list = Array.isArray(data) ? data : data.listings || [];
      setListings(list);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError("Không thể kết nối đến server");
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      } else {
        setTableLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchListings(filter, true);
  }, []); // Chỉ fetch lần đầu

  useEffect(() => {
    if (!initialLoading) {
      fetchListings(filter, false);
    }
  }, [filter, initialLoading, fetchListings]);

  const safeIncludes = (hay?: string, needle?: string) =>
    (hay || "").toLowerCase().includes((needle || "").toLowerCase());

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesFilter = listing.status === filter;
      const s = searchTerm.trim();
      if (!s) return matchesFilter;
      const matchesSearch =
        safeIncludes(listing.make, s) ||
        safeIncludes(listing.model, s) ||
        safeIncludes(listing.location?.city, s) ||
        safeIncludes(listing.location?.district, s) ||
        (listing.year ? String(listing.year) === s : false);
      return matchesFilter && matchesSearch;
    });
  }, [listings, filter, searchTerm]);

  const getStatusBadge = (status: string) => {
    const styles = {
      PendingReview: "bg-yellow-100 text-yellow-700",
      Published: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
      Draft: "bg-gray-100 text-gray-700",
      InTransaction: "bg-blue-100 text-blue-700",
      Sold: "bg-purple-100 text-purple-700",
      Expired: "bg-orange-100 text-orange-700",
    } as const;
    const labels = {
      PendingReview: "Chờ duyệt",
      Published: "Đã duyệt",
      Rejected: "Từ chối",
      Draft: "Bản nháp",
      InTransaction: "Đang giao dịch",
      Sold: "Đã bán",
      Expired: "Hết hạn",
    } as const;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => (type === "Car" ? "Xe điện" : "Pin");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatSellerId = (sellerId: SellerIdUnion | undefined) => {
    if (!sellerId) return "N/A";
    if (typeof sellerId === "string") return sellerId;
    return sellerId._id || sellerId.id || "N/A";
  };

  const getPopulatedSeller = (sellerId: SellerIdUnion | undefined) => {
    if (!sellerId || typeof sellerId === "string") return undefined;
    const { fullName, email, phone } = sellerId;
    if (fullName || email || phone)
      return {
        fullName: fullName || "N/A",
        email: [email, phone].filter(Boolean).join(" · ") || "N/A",
      };
    return undefined;
  };

  const SellerInfo = memo(
    ({ sellerId }: { sellerId: SellerIdUnion | undefined }) => {
      const popu = getPopulatedSeller(sellerId);
      const userId = formatSellerId(sellerId);
      const isLoading = fetchingUsersRef.current.has(userId);

      useEffect(() => {
        if (popu) return;
        if (userId === "N/A") return;
        if (users[userId]) return;
        if (fetchingUsersRef.current.has(userId)) return;
        (async () => {
          try {
            await fetchUserInfo(userId);
          } catch (e) {
            console.error("Error loading user info:", e);
          }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [userId]);

      if (popu) {
        return (
          <div>
            <div className="font-medium">{popu.fullName}</div>
            <div className="text-xs text-gray-500">{popu.email}</div>
          </div>
        );
      }

      if (isLoading) return <span className="text-gray-400">Đang tải...</span>;

      const userInfo = users[userId];
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
      if (users[userId]) return users[userId];
      if (fetchingUsersRef.current.has(userId)) {
        return (
          apiCallsRef.current.get(userId) ||
          Promise.resolve({ fullName: "N/A", email: "N/A" })
        );
      }
      const apiPromise = (async () => {
        try {
          const userData = await usersService.getUserById(userId);
          const userInfo = {
            fullName: userData?.fullName || "N/A",
            email: userData?.email || "N/A",
          };
          setUsers((prev) => ({ ...prev, [userId]: userInfo }));
          return userInfo;
        } catch {
          return { fullName: "N/A", email: "N/A" };
        } finally {
          fetchingUsersRef.current.delete(userId);
          apiCallsRef.current.delete(userId);
        }
      })();
      apiCallsRef.current.set(userId, apiPromise);
      fetchingUsersRef.current.add(userId);
      return apiPromise;
    },
    [users]
  );

  const approveListing = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      await listingsService.approveListing(listingId);

      // Cập nhật local state (sử dụng functional update để tránh stale state)
      setListings((prev) =>
        prev.map((listing) =>
          listing._id === listingId
            ? { ...listing, status: "Published" as const }
            : listing
        )
      );

      // Đóng modal
      setSelectedListing(null);
      fetchListings(filter, false);
    } catch (err) {
      console.error("Error approving listing:", err);
      setError(err instanceof Error ? err.message : "Lỗi khi duyệt tin đăng");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectListing = async (listingId: string) => {
    const reason = window.prompt("Nhập lý do từ chối (tuỳ chọn):") || undefined;
    setActionLoading(listingId);
    try {
      if (reason && reason.trim()) {
        await listingsService.rejectListing(listingId, reason.trim());
      } else {
        await listingsService.rejectListing(listingId);
      }
      setListings((prev) =>
        prev.map((l) =>
          l._id === listingId
            ? { ...l, status: "Rejected", rejectReason: reason }
            : l
        )
      );
      setSelectedListing(null);
      fetchListings(filter, false);
    } catch (err) {
      console.error("Error rejecting listing:", err);
      setError(err instanceof Error ? err.message : "Lỗi khi từ chối tin đăng");
    } finally {
      setActionLoading(null);
    }
  };

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Đang tải...</div>
        </div>
      </Layout>
    );
  }

  /** Small helper for detail cards */
  const FieldBox = ({
    label,
    value,
  }: {
    label: string;
    value?: React.ReactNode;
  }) => (
    <div className="bg-gray-50 p-4 rounded-xl">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="font-semibold text-gray-900">{value ?? "—"}</p>
    </div>
  );

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
            </div>
          </div>

          <div className="overflow-x-auto relative">
            {tableLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-gray-600">
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Đang tải...</span>
                </div>
              </div>
            )}
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
                    Ngày tạo
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
                        {listing.photos?.length > 0 && (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={listing.photos[0].url}
                              alt={
                                `${listing.make || ""} ${
                                  listing.model || ""
                                }`.trim() || "Ảnh"
                              }
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-900">
                            {[listing.make, listing.model]
                              .filter(Boolean)
                              .join(" ") || "Không rõ"}
                            {listing.year ? ` (${listing.year})` : ""}
                          </span>
                          <div className="text-sm text-gray-500">
                            {[
                              listing.location?.city,
                              listing.location?.district,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      <div className="text-sm">
                        <SellerInfo
                          sellerId={listing.sellerId as SellerIdUnion}
                        />
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
                {filteredListings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      Không có bản ghi nào.
                    </td>
                  </tr>
                )}
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
                      {[selectedListing.make, selectedListing.model]
                        .filter(Boolean)
                        .join(" ") || "Không rõ"}
                      {selectedListing.year ? ` (${selectedListing.year})` : ""}
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

                {selectedListing.photos?.length ? (
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
                            src={photo.url}
                            alt={`${selectedListing.make || "Ảnh"} ${
                              index + 1
                            }`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Info blocks */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <FieldBox
                    label="Loại"
                    value={getTypeBadge(selectedListing.type)}
                  />
                  <FieldBox
                    label="Tình trạng"
                    value={
                      selectedListing.condition === "New"
                        ? "Mới"
                        : selectedListing.condition === "LikeNew"
                        ? "Như mới"
                        : selectedListing.condition === "Used"
                        ? "Đã sử dụng"
                        : selectedListing.condition === "Worn"
                        ? "Cũ"
                        : "—"
                    }
                  />
                  <FieldBox
                    label="Người đăng"
                    value={
                      <SellerInfo
                        sellerId={selectedListing.sellerId as SellerIdUnion}
                      />
                    }
                  />
                  <FieldBox
                    label="Phương thức giao dịch"
                    value={
                      selectedListing.tradeMethod === "meet"
                        ? "Gặp mặt"
                        : selectedListing.tradeMethod === "ship"
                        ? "Giao hàng"
                        : "Ủy thác"
                    }
                  />
                  <FieldBox
                    label="Ngày tạo"
                    value={formatDate(selectedListing.createdAt)}
                  />
                  <FieldBox label="ID" value={selectedListing._id} />
                </div>

                {/* By type */}
                {selectedListing.type === "Car" && (
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FieldBox
                        label="Số km đã đi"
                        value={
                          typeof selectedListing.mileageKm === "number"
                            ? `${selectedListing.mileageKm.toLocaleString()} km`
                            : "—"
                        }
                      />
                      <FieldBox
                        label="Dung lượng pin (nếu có)"
                        value={
                          typeof selectedListing.batteryCapacityKWh === "number"
                            ? `${selectedListing.batteryCapacityKWh} kWh`
                            : "—"
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FieldBox
                        label="Biển số"
                        value={selectedListing.licensePlate}
                      />
                      <FieldBox
                        label="Dung tích xi-lanh"
                        value={
                          typeof selectedListing.engineDisplacementCc ===
                          "number"
                            ? `${selectedListing.engineDisplacementCc} cc`
                            : "—"
                        }
                      />
                      <FieldBox
                        label="Loại xe"
                        value={selectedListing.vehicleType}
                      />
                      <FieldBox
                        label="Màu sơn"
                        value={selectedListing.paintColor}
                      />
                      <FieldBox
                        label="Số máy"
                        value={selectedListing.engineNumber}
                      />
                      <FieldBox
                        label="Số khung"
                        value={selectedListing.chassisNumber}
                      />
                      <FieldBox
                        label="Đặc điểm khác"
                        value={selectedListing.otherFeatures}
                      />
                    </div>
                  </div>
                )}

                {selectedListing.type === "Battery" && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <FieldBox
                      label="Dung lượng pin"
                      value={
                        typeof selectedListing.batteryCapacityKWh === "number"
                          ? `${selectedListing.batteryCapacityKWh} kWh`
                          : "—"
                      }
                    />
                    <FieldBox
                      label="Số lần sạc"
                      value={
                        typeof selectedListing.chargeCycles === "number"
                          ? `${selectedListing.chargeCycles} lần`
                          : "—"
                      }
                    />
                    <FieldBox label="Hãng" value={selectedListing.make} />
                    <FieldBox label="Model" value={selectedListing.model} />
                    <FieldBox label="Năm" value={selectedListing.year ?? "—"} />
                  </div>
                )}

                {selectedListing.location && (
                  <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <p className="text-sm text-gray-600 mb-1">Địa chỉ</p>
                    <p className="font-semibold text-gray-900">
                      {[
                        selectedListing.location?.address,
                        selectedListing.location?.district,
                        selectedListing.location?.city,
                      ]
                        .filter(Boolean)
                        .join(", ")}
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
