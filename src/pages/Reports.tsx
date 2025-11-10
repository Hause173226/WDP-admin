import { useState, useEffect, useMemo } from "react";
import Layout from "../components/Layout";
import { Download, TrendingUp, Filter } from "lucide-react";
import {
  usersService,
  transactionsService,
  listingsService,
  systemWalletService,
} from "../services/api";
import { User, Transaction, Listing, SystemWallet } from "../types";

type TimeFilter = "7days" | "30days" | "year";
type ExportFormat = "csv" | "pdf";

export default function Reports() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30days");
  const [transactionStatusFilter, setTransactionStatusFilter] =
    useState<string>("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [systemWallet, setSystemWallet] = useState<SystemWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [usersRes, listingsRes, transactionsRes, walletRes] =
        await Promise.all([
          usersService.getAllUsers(),
          listingsService.getAllListings(1, 100),
          transactionsService.getAllTransactions(1, 1000),
          systemWalletService.getSystemWallet(),
        ]);

      if (usersRes && Array.isArray(usersRes)) {
        setUsers(usersRes);
      } else if (usersRes?.data && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }

      // Handle new API response structure: { listings: [...], pagination: {...} }
      if (listingsRes?.listings && Array.isArray(listingsRes.listings)) {
        setListings(listingsRes.listings);
      } else if (listingsRes?.success && listingsRes?.data) {
        setListings(Array.isArray(listingsRes.data) ? listingsRes.data : []);
      } else if (Array.isArray(listingsRes)) {
        setListings(listingsRes);
      }

      if (transactionsRes?.success && transactionsRes?.data) {
        setAllTransactions(transactionsRes.data);
      }

      if (walletRes?.success && walletRes?.data) {
        setSystemWallet(walletRes.data);
      }
    } catch (err) {
      console.error("Error fetching reports data:", err);
      setError(
        err instanceof Error ? err.message : "Không thể tải dữ liệu báo cáo"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleExport = (format: ExportFormat) => {
    if (format === "csv") {
      exportToCSV();
    } else if (format === "pdf") {
      exportToPDF();
    }
    setShowExportModal(false);
  };

  const exportToCSV = () => {
    // Prepare CSV data - use filtered transactions
    const headers = [
      "Mã GD",
      "Sản phẩm",
      "Người mua",
      "Email",
      "Số tiền",
      "Ngày tạo",
      "Ngày hoàn thành",
      "Trạng thái",
    ];

    const rows = latestTransactions.map((transaction) => {
      const productName =
        transaction.listing.make && transaction.listing.model
          ? `${transaction.listing.make} ${transaction.listing.model}`
          : transaction.listing.title || "N/A";
      return [
        transaction.id.slice(-8).toUpperCase(),
        productName,
        transaction.counterparty.name,
        transaction.counterparty.email || "",
        transaction.amount.total.toString(),
        transaction.dates.createdAt
          ? formatDate(transaction.dates.createdAt)
          : "",
        transaction.dates.completedAt
          ? formatDate(transaction.dates.completedAt)
          : "",
        transaction.status,
      ];
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Add BOM for UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `bao-cao-giao-dich-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    // Create a new window with report content
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Vui lòng cho phép popup để xuất PDF");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Báo cáo giao dịch</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              text-align: center;
              color: #1f2937;
              margin-bottom: 30px;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            .stat-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>BÁO CÁO GIAO DỊCH</h1>
          <div class="stats">
            <div class="stat-card">
              <div class="stat-label">Người dùng</div>
              <div class="stat-value">${formatNumber(totalUsers)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Tin đăng</div>
              <div class="stat-value">${formatNumber(totalListings)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Doanh thu</div>
              <div class="stat-value">${formatPrice(totalRevenue)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">GD thành công</div>
              <div class="stat-value">${formatNumber(
                totalCompletedTransactions
              )}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Tin kiểm định</div>
              <div class="stat-value">${formatNumber(certifiedListings)}</div>
            </div>
          </div>
          <h2>Giao dịch gần nhất</h2>
          <table>
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Sản phẩm</th>
                <th>Người mua</th>
                <th>Số tiền</th>
                <th>Ngày</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${latestTransactions
                .map(
                  (transaction) => `
                <tr>
                  <td>${transaction.id.slice(-8).toUpperCase()}</td>
                  <td>${
                    transaction.listing.make && transaction.listing.model
                      ? `${transaction.listing.make} ${transaction.listing.model}`
                      : transaction.listing.title || "N/A"
                  }</td>
                  <td>${transaction.counterparty.name}</td>
                  <td>${formatPrice(transaction.amount.total)}</td>
                  <td>${formatDate(
                    transaction.dates.completedAt || transaction.dates.createdAt
                  )}</td>
                  <td>${transaction.status}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>Xuất ngày: ${new Date().toLocaleDateString("vi-VN")}</p>
            <p>Báo cáo được tạo từ hệ thống quản trị</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Calculate stats from real data
  const totalUsers = users.length;
  const totalListings = listings.length;
  const totalRevenue = systemWallet?.totalEarned || 0;
  const completedTransactions = allTransactions.filter(
    (t) => t.status === "COMPLETED"
  );
  const totalCompletedTransactions = completedTransactions.length;
  const certifiedListings = listings.filter(
    (l) => l.status === "Published"
  ).length;

  // Calculate transaction stats
  const calculateTransactionStats = () => {
    const total = allTransactions.length;
    if (total === 0) return [];

    const completed = allTransactions.filter(
      (t) => t.status === "COMPLETED"
    ).length;
    const pending = allTransactions.filter(
      (t) => t.status === "PENDING"
    ).length;
    const cancelled = allTransactions.filter(
      (t) => t.status === "CANCELLED"
    ).length;
    const confirmed = allTransactions.filter(
      (t) => t.status === "CONFIRMED"
    ).length;

    return [
      {
        status: "Hoàn tất",
        count: completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        color: "bg-green-600",
      },
      {
        status: "Đang xử lý",
        count: pending + confirmed,
        percentage:
          total > 0 ? Math.round(((pending + confirmed) / total) * 100) : 0,
        color: "bg-yellow-600",
      },
      {
        status: "Đã hủy",
        count: cancelled,
        percentage: total > 0 ? Math.round((cancelled / total) * 100) : 0,
        color: "bg-red-600",
      },
    ];
  };

  const transactionStats = calculateTransactionStats();

  // Calculate revenue data from completed transactions
  const revenueData = useMemo(() => {
    const completed = allTransactions.filter((t) => t.status === "COMPLETED");
    if (completed.length === 0) {
      return [];
    }

    const now = new Date();
    let startDate: Date;
    let periodCount: number;
    let periodLabel: (date: Date) => string;

    switch (timeFilter) {
      case "7days":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        periodCount = 7;
        periodLabel = (date: Date) => {
          return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          });
        };
        break;
      case "30days":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        periodCount = 30;
        periodLabel = (date: Date) => {
          return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          });
        };
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        periodCount = 12;
        periodLabel = (date: Date) => {
          return date.toLocaleDateString("vi-VN", { month: "2-digit" });
        };
        break;
      default:
        return [];
    }

    const revenueMap = new Map<string, number>();

    for (let i = 0; i < periodCount; i++) {
      const periodDate = new Date(startDate);
      if (timeFilter === "year") {
        periodDate.setMonth(i);
      } else {
        periodDate.setDate(startDate.getDate() + i);
      }
      const key = periodLabel(periodDate);
      revenueMap.set(key, 0);
    }

    completed.forEach((transaction) => {
      const transactionDate = new Date(
        transaction.dates.completedAt || transaction.dates.createdAt
      );

      if (transactionDate >= startDate && transactionDate <= now) {
        let key: string;
        if (timeFilter === "year") {
          key = periodLabel(
            new Date(
              transactionDate.getFullYear(),
              transactionDate.getMonth(),
              1
            )
          );
        } else {
          key = periodLabel(transactionDate);
        }

        const currentRevenue = revenueMap.get(key) || 0;
        revenueMap.set(key, currentRevenue + transaction.amount.total);
      }
    });

    return Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({
        date,
        revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allTransactions, timeFilter]);

  // Get latest transactions (sorted by date, latest first)
  const latestTransactions = useMemo(() => {
    let filtered = [...allTransactions];

    // Apply status filter
    if (transactionStatusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === transactionStatusFilter);
    }

    return filtered
      .sort((a, b) => {
        const dateA = new Date(
          a.dates.completedAt || a.dates.createdAt
        ).getTime();
        const dateB = new Date(
          b.dates.completedAt || b.dates.createdAt
        ).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [allTransactions, transactionStatusFilter]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      COMPLETED: {
        text: "Hoàn tất",
        className: "bg-green-100 text-green-700",
      },
      PENDING: {
        text: "Đang xử lý",
        className: "bg-yellow-100 text-yellow-700",
      },
      CANCELLED: { text: "Đã hủy", className: "bg-red-100 text-red-700" },
      CONFIRMED: {
        text: "Đã xác nhận",
        className: "bg-blue-100 text-blue-700",
      },
      REJECTED: { text: "Từ chối", className: "bg-gray-100 text-gray-700" },
    };
    const statusInfo = statusMap[status] || {
      text: status,
      className: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
      >
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Thống kê & Báo cáo
            </h1>
            <p className="text-gray-600 mt-1">
              Phân tích chi tiết về hoạt động nền tảng
            </p>
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
          {(["7days", "30days", "year"] as TimeFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                timeFilter === filter
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {filter === "7days" && "7 ngày qua"}
              {filter === "30days" && "30 ngày qua"}
              {filter === "year" && "Năm nay"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Người dùng</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatNumber(totalUsers)}
            </p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />
              <span>+12%</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Tin đăng</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatNumber(totalListings)}
            </p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />
              <span>+8%</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Doanh thu</p>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {formatPrice(totalRevenue)}
            </p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />
              <span>+15%</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">GD thành công</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatNumber(totalCompletedTransactions)}
            </p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />
              <span>+5%</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Tin kiểm định</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatNumber(certifiedListings)}
            </p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp size={16} />
              <span>+10%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Biểu đồ doanh thu
          </h2>
          <div className="h-80 flex items-end justify-between gap-3">
            {revenueData.length === 0 ? (
              <div className="w-full text-center py-8 text-gray-500">
                Chưa có dữ liệu doanh thu
              </div>
            ) : (
              revenueData.map(
                (data: { date: string; revenue: number }, index: number) => {
                  const maxRevenue = Math.max(
                    ...revenueData.map(
                      (d: { date: string; revenue: number }) => d.revenue
                    ),
                    1
                  );
                  const height =
                    maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-3"
                    >
                      <div
                        className="w-full bg-gray-100 rounded-t-xl relative group cursor-pointer hover:bg-blue-50 transition-colors"
                        style={{
                          height: `${height}%`,
                          minHeight: height > 0 ? "40px" : "0",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl"></div>
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-10">
                          <div className="font-semibold">
                            {formatPrice(data.revenue)}
                          </div>
                          <div className="text-xs text-gray-300">
                            {data.date}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {data.date}
                      </span>
                    </div>
                  );
                }
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Tỷ lệ trạng thái giao dịch
          </h2>
          <div className="space-y-4">
            {transactionStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có dữ liệu giao dịch
              </div>
            ) : (
              transactionStats.map((stat, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 font-medium">
                      {stat.status}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">
                        {stat.count} giao dịch
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {stat.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`${stat.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Giao dịch gần nhất
            </h2>
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-gray-600" />
              <select
                value={transactionStatusFilter}
                onChange={(e) => setTransactionStatusFilter(e.target.value)}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Mã GD
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Sản phẩm
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Người mua
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Số tiền
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Ngày
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {latestTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                ) : (
                  latestTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {transaction.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {transaction.listing.make && transaction.listing.model
                          ? `${transaction.listing.make} ${transaction.listing.model}`
                          : transaction.listing.title || "N/A"}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {transaction.counterparty.name}
                      </td>
                      <td className="py-4 px-4 text-gray-900 font-medium">
                        {formatPrice(transaction.amount.total)}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {formatDate(
                          transaction.dates.completedAt ||
                            transaction.dates.createdAt
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
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Xuất báo cáo
            </h3>
            <p className="text-gray-600 mb-6">
              Chọn định dạng file để xuất báo cáo
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleExport("csv")}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                Xuất file CSV
              </button>
              <button
                onClick={() => handleExport("pdf")}
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
