import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import { History, Wallet, TrendingUp, Filter } from "lucide-react";
import { SystemWallet, Transaction, TransactionsResponse } from "../types";
import { systemWalletService, transactionsService } from "../services/api";

export default function Fees() {
  const [systemWallet, setSystemWallet] = useState<SystemWallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  useEffect(() => {
    fetchSystemWallet();
  }, []);

  const fetchTransactions = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        const response: TransactionsResponse =
          await transactionsService.getAllTransactions(page, 20);
        if (response.success) {
          setPagination(response.pagination);
          // Apply filter after setting all transactions
          if (statusFilter === "all") {
            setTransactions(response.data);
          } else {
            const filtered = response.data.filter(
              (t) => t.status === statusFilter
            );
            setTransactions(filtered);
          }
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(
          err instanceof Error ? err.message : "Không thể tải lịch sử giao dịch"
        );
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, fetchTransactions]);

  const fetchSystemWallet = async () => {
    try {
      const response = await systemWalletService.getSystemWallet();
      if (response.success) {
        setSystemWallet(response.data);
      }
    } catch (err) {
      console.error("Error fetching system wallet:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải thông tin ví hệ thống"
      );
    }
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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      COMPLETED: {
        text: "Hoàn thành",
        className: "bg-green-100 text-green-800",
      },
      PENDING: { text: "Đang chờ", className: "bg-yellow-100 text-yellow-800" },
      CANCELLED: { text: "Đã hủy", className: "bg-red-100 text-red-800" },
      CONFIRMED: {
        text: "Đã xác nhận",
        className: "bg-blue-100 text-blue-800",
      },
      REJECTED: { text: "Từ chối", className: "bg-gray-100 text-gray-800" },
    };
    const statusInfo = statusMap[status] || {
      text: status,
      className: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
      >
        {statusInfo.text}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Phí</h1>
          <p className="text-gray-600 mt-1">
            Thiết lập và quản lý phí dịch vụ trên nền tảng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="text-gray-400" size={20} />
              <p className="text-sm text-gray-600">Số dư ví hệ thống</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {systemWallet ? formatPrice(systemWallet.balance) : "..."}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-gray-400" size={20} />
              <p className="text-sm text-gray-600">Tổng thu nhập</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {systemWallet ? formatPrice(systemWallet.totalEarned) : "..."}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Tổng giao dịch</p>
            <p className="text-3xl font-bold text-gray-900">
              {systemWallet ? systemWallet.totalTransactions : "..."}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Lịch sử giao dịch
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1); // Reset to page 1 when filter changes
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="PENDING">Đang chờ</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                        Ngày tạo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                        Sản phẩm
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                        Người mua
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                        Tổng tiền
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          Không có giao dịch nào
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4 text-gray-600 text-sm">
                            {formatDate(transaction.dates.createdAt)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-900 font-medium">
                              {transaction.listing.make &&
                              transaction.listing.model
                                ? `${transaction.listing.make} ${transaction.listing.model}`
                                : transaction.listing.title || "N/A"}
                            </div>
                            {transaction.listing.year && (
                              <div className="text-sm text-gray-500">
                                Năm: {transaction.listing.year}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-900 font-medium">
                              {transaction.counterparty.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.counterparty.email}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-900 font-medium">
                              {formatPrice(transaction.amount.total)}
                            </div>
                            {transaction.amount.deposit > 0 && (
                              <div className="text-sm text-gray-500">
                                Đặt cọc:{" "}
                                {formatPrice(transaction.amount.deposit)}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(transaction.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  {statusFilter === "all" ? (
                    <>
                      Trang {pagination.current} / {pagination.pages} (Tổng:{" "}
                      {pagination.total} giao dịch)
                    </>
                  ) : (
                    <>
                      Hiển thị {transactions.length} giao dịch{" "}
                      {getStatusBadge(statusFilter).props.children}
                    </>
                  )}
                </div>
                {pagination.pages > 1 && statusFilter === "all" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={pagination.current === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(pagination.pages, prev + 1)
                        )
                      }
                      disabled={pagination.current === pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
