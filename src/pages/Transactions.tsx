import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import { Eye, Download, AlertCircle, RefreshCw } from "lucide-react";
import {
  Transaction,
  TransactionsResponse,
  TransactionDetailResponse,
} from "../types";
import { transactionsService } from "../services/api";

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [transactionDetail, setTransactionDetail] = useState<
    TransactionDetailResponse["data"] | null
  >(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 8,
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
  });

  const fetchTransactions = useCallback(
    async (page: number = 1) => {
      try {
        // Nếu chưa load lần nào, dùng initialLoading
        // Nếu đã load rồi (chuyển trang), chỉ dùng tableLoading
        if (!hasLoadedOnce) {
          setInitialLoading(true);
        } else {
          setTableLoading(true);
        }
        setError(null);
        const response: TransactionsResponse =
          await transactionsService.getAllTransactions(page, 8);
        setTransactions(response.data);
        setPagination(response.pagination);
        setHasLoadedOnce(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách giao dịch"
        );
        console.error("Error fetching transactions:", err);
      } finally {
        setInitialLoading(false);
        setTableLoading(false);
      }
    },
    [hasLoadedOnce]
  );

  // Fetch stats tổng từ tất cả transactions
  const fetchStats = useCallback(async () => {
    try {
      // Fetch trang đầu với limit lớn để lấy tổng số và tính stats
      const response: TransactionsResponse =
        await transactionsService.getAllTransactions(1, 1000);
      const allTransactions = response.data;
      const total = response.pagination.total;

      // Nếu có nhiều hơn 1000 transactions, chỉ tính từ sample
      // Hoặc có thể fetch thêm các trang nếu cần chính xác 100%
      // Ở đây tôi sẽ dùng total từ pagination và tính stats từ data có được
      setStats({
        total: total,
        completed: allTransactions.filter((t) => t.status === "COMPLETED")
          .length,
        pending: allTransactions.filter((t) => t.status === "PENDING").length,
        cancelled: allTransactions.filter((t) => t.status === "CANCELLED")
          .length,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      // Nếu lỗi, giữ nguyên stats hiện tại
    }
  }, []);

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, fetchTransactions]);

  // Fetch stats một lần khi component mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch transaction detail khi mở modal
  useEffect(() => {
    if (selectedTransaction) {
      const fetchDetail = async () => {
        try {
          setDetailLoading(true);
          setDetailError(null);
          const response: TransactionDetailResponse =
            await transactionsService.getTransactionDetail(
              selectedTransaction.appointmentId
            );
          setTransactionDetail(response.data);
        } catch (err) {
          setDetailError(
            err instanceof Error
              ? err.message
              : "Không thể tải chi tiết giao dịch"
          );
          console.error("Error fetching transaction detail:", err);
        } finally {
          setDetailLoading(false);
        }
      };
      fetchDetail();
    } else {
      setTransactionDetail(null);
      setDetailError(null);
    }
  }, [selectedTransaction]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-700",
      CONFIRMED: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-gray-100 text-gray-700",
      REJECTED: "bg-red-100 text-red-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    const labels: Record<string, string> = {
      PENDING: "Đang chờ",
      CONFIRMED: "Đã xác nhận",
      CANCELLED: "Đã hủy",
      REJECTED: "Đã từ chối",
      COMPLETED: "Hoàn tất",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          styles[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getListingName = (listing: Transaction["listing"]) => {
    if (listing.make && listing.model && listing.year) {
      return `${listing.make} ${listing.model} ${listing.year}`;
    }
    return listing.title || "N/A";
  };

  // Sử dụng stats tổng thay vì tính từ transactions hiện tại
  const totalTransactions = stats.total;
  const completedTransactions = stats.completed;
  const pendingTransactions = stats.pending;
  const cancelledTransactions = stats.cancelled;

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
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
            Quản lý Giao dịch
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi và xử lý các giao dịch trên nền tảng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Tổng giao dịch</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalTransactions}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Đã hoàn tất</p>
            <p className="text-3xl font-bold text-green-600">
              {completedTransactions}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Đang chờ</p>
            <p className="text-3xl font-bold text-yellow-600">
              {pendingTransactions}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Đã hủy</p>
            <p className="text-3xl font-bold text-red-600">
              {cancelledTransactions}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={() => fetchTransactions(currentPage)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw size={16} />
              Thử lại
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách giao dịch
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => fetchTransactions(currentPage)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                title="Làm mới"
              >
                <RefreshCw size={18} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                <Download size={18} />
                Xuất CSV
              </button>
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
                    Mã GD
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Loại
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Đối tác
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Sản phẩm
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Số tiền
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
                {transactions.length === 0 && !tableLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      Không có giao dịch nào
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900 text-sm">
                          {transaction.id.slice(-8)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {transaction.type === "buyer"
                            ? "Người mua"
                            : "Người bán"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-gray-900 font-medium">
                            {transaction.counterparty.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.counterparty.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {getListingName(transaction.listing)}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-gray-900 font-medium">
                            {formatPrice(transaction.amount.total)}
                          </p>
                          {transaction.amount.deposit > 0 && (
                            <p className="text-xs text-gray-500">
                              Cọc: {formatPrice(transaction.amount.deposit)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {formatDate(transaction.dates.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedTransaction(transaction)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} className="text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-gray-700">
                Trang {pagination.current} / {pagination.pages}
              </span>
              <button
                onClick={() => {
                  if (currentPage < pagination.pages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                disabled={currentPage === pagination.pages}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Chi tiết giao dịch
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-gray-600">
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Đang tải chi tiết...</span>
                  </div>
                </div>
              ) : detailError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-red-600" size={20} />
                    <p className="text-red-700">{detailError}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Mã giao dịch</p>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedTransaction.id}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(selectedTransaction.status)}
                    </div>
                  </div>

                  {transactionDetail?.appointment && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h5 className="font-semibold text-blue-900 mb-3">
                        Thông tin cuộc hẹn
                      </h5>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-blue-700 font-medium">
                            Loại cuộc hẹn:
                          </p>
                          <p className="text-blue-900">
                            {transactionDetail.appointment.appointmentType ===
                            "AUCTION"
                              ? "Đấu giá"
                              : transactionDetail.appointment.type ===
                                "CONTRACT_SIGNING"
                              ? "Ký hợp đồng"
                              : transactionDetail.appointment.type}
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-700 font-medium">Địa điểm:</p>
                          <p className="text-blue-900">
                            {transactionDetail.appointment.location || "N/A"}
                          </p>
                        </div>
                        {transactionDetail.appointment.notes && (
                          <div className="col-span-2">
                            <p className="text-blue-700 font-medium">
                              Ghi chú:
                            </p>
                            <p className="text-blue-900">
                              {transactionDetail.appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {transactionDetail?.appointment && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Người mua</p>
                        <p className="font-semibold text-gray-900">
                          {transactionDetail.appointment.buyerId?.fullName ||
                            "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {transactionDetail.appointment.buyerId?.email || ""}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transactionDetail.appointment.buyerId?.phone || ""}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              transactionDetail.appointment.buyerConfirmed
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {transactionDetail.appointment.buyerConfirmed
                              ? "Đã xác nhận"
                              : "Chưa xác nhận"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Người bán</p>
                        <p className="font-semibold text-gray-900">
                          {transactionDetail.appointment.sellerId?.fullName ||
                            "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {transactionDetail.appointment.sellerId?.email || ""}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transactionDetail.appointment.sellerId?.phone || ""}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              transactionDetail.appointment.sellerConfirmed
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {transactionDetail.appointment.sellerConfirmed
                              ? "Đã xác nhận"
                              : "Chưa xác nhận"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">
                        Loại giao dịch
                      </p>
                      <p className="font-semibold text-gray-900">
                        {selectedTransaction.type === "buyer"
                          ? "Người mua"
                          : "Người bán"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Đối tác</p>
                      <p className="font-semibold text-gray-900">
                        {selectedTransaction.counterparty.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedTransaction.counterparty.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedTransaction.counterparty.phone}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Sản phẩm</p>
                      <p className="font-semibold text-gray-900">
                        {getListingName(selectedTransaction.listing)}
                      </p>
                      {selectedTransaction.listing.priceListed > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Giá:{" "}
                          {formatPrice(selectedTransaction.listing.priceListed)}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Tổng tiền</p>
                      <p className="font-semibold text-blue-600 text-lg">
                        {formatPrice(selectedTransaction.amount.total)}
                      </p>
                      {selectedTransaction.amount.deposit > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Cọc: {formatPrice(selectedTransaction.amount.deposit)}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(selectedTransaction.dates.createdAt)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 mb-1">Ngày hẹn</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(selectedTransaction.dates.scheduledDate)}
                      </p>
                    </div>
                    {selectedTransaction.dates.cancelledAt && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Ngày hủy</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(selectedTransaction.dates.cancelledAt)}
                        </p>
                      </div>
                    )}
                    {selectedTransaction.dates.completedAt && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">
                          Ngày hoàn tất
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(selectedTransaction.dates.completedAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedTransaction.contract && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h5 className="font-semibold text-blue-900 mb-2">
                        Thông tin hợp đồng
                      </h5>
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Số hợp đồng:</span>{" "}
                        {selectedTransaction.contract.contractNumber}
                      </p>
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Trạng thái:</span>{" "}
                        {selectedTransaction.contract.status}
                      </p>
                      {selectedTransaction.contract.signedAt && (
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Ngày ký:</span>{" "}
                          {formatDate(selectedTransaction.contract.signedAt)}
                        </p>
                      )}
                      {selectedTransaction.contract.completedAt && (
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Ngày hoàn tất:</span>{" "}
                          {formatDate(selectedTransaction.contract.completedAt)}
                        </p>
                      )}
                      {selectedTransaction.contract.photos &&
                        selectedTransaction.contract.photos.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-blue-900 mb-2">
                              Ảnh hợp đồng:
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {selectedTransaction.contract.photos.map(
                                (photo, index) => (
                                  <img
                                    key={index}
                                    src={photo.url}
                                    alt={`Contract photo ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Trạng thái cọc</p>
                    <p className="font-semibold text-gray-900">
                      {selectedTransaction.depositRequest.status === "IN_ESCROW"
                        ? "Đã ký quỹ"
                        : selectedTransaction.depositRequest.status ===
                          "PENDING_SELLER_CONFIRMATION"
                        ? "Chờ xác nhận người bán"
                        : selectedTransaction.depositRequest.status ===
                          "CANCELLED"
                        ? "Đã hủy"
                        : "Không xác định"}
                    </p>
                    {selectedTransaction.depositRequest.depositAmount > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Số tiền cọc:{" "}
                        {formatPrice(
                          selectedTransaction.depositRequest.depositAmount
                        )}
                      </p>
                    )}
                  </div>
                </>
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
