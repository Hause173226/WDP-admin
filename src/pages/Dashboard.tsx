import Layout from "../components/Layout";
import { Users, FileText, DollarSign, CheckCircle, Award } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  usersService,
  transactionsService,
  listingsService,
  systemWalletService,
} from "../services/api";
import {
  User,
  Transaction,
  Listing,
  SystemWallet,
  RevenueChartResponse,
} from "../types";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type TimeFilter = "7days" | "30days" | "year";

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7days");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [completedTransactions, setCompletedTransactions] = useState<
    Transaction[]
  >([]);
  const [systemWallet, setSystemWallet] = useState<SystemWallet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revenueChartData, setRevenueChartData] =
    useState<RevenueChartResponse | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  const fetchRevenueChartData = useCallback(async () => {
    try {
      setRevenueLoading(true);
      setRevenueError(null);

      const now = new Date();
      let period: "day" | "month" | "year" = "day";
      let startDate: Date;
      const endDate: Date = new Date(now);

      // Calculate start and end dates based on filter
      switch (timeFilter) {
        case "7days":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 6); // 7 days including today
          period = "day";
          break;
        case "30days":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 29); // 30 days including today
          period = "day";
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1); // Start of year
          period = "month";
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 29);
      }

      // Format dates to ISO 8601
      const startDateISO = startDate.toISOString();
      const endDateISO = endDate.toISOString();

      const response = await systemWalletService.getRevenueChartData(
        period,
        startDateISO,
        endDateISO
      );

      if (response.success && response.data) {
        setRevenueChartData(response);
      } else {
        setRevenueError("Không thể tải dữ liệu biểu đồ doanh thu");
      }
    } catch (err) {
      console.error("Error fetching revenue chart data:", err);
      setRevenueError(
        err instanceof Error
          ? err.message
          : "Không thể tải dữ liệu biểu đồ doanh thu"
      );
    } finally {
      setRevenueLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchDashboardData();
    fetchRevenueChartData();
  }, [fetchRevenueChartData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [usersRes, listingsRes, transactionsRes, walletRes] =
        await Promise.all([
          usersService.getAllUsers(),
          listingsService.getAllListings(),
          transactionsService.getAllTransactions(1, 1000), // Get many transactions to filter
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
        const allTransactions = transactionsRes.data;
        // Filter only COMPLETED transactions
        const completed = allTransactions.filter(
          (t: Transaction) => t.status === "COMPLETED"
        );
        // Sort by completedAt or createdAt descending
        completed.sort((a: Transaction, b: Transaction) => {
          const dateA = new Date(
            a.dates?.completedAt || a.dates?.createdAt || new Date()
          ).getTime();
          const dateB = new Date(
            b.dates?.completedAt || b.dates?.createdAt || new Date()
          ).getTime();
          return dateB - dateA;
        });
        setCompletedTransactions(completed.slice(0, 5)); // Get latest 5 for display
      }

      if (walletRes?.success && walletRes?.data) {
        setSystemWallet(walletRes.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Không thể tải dữ liệu dashboard"
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format chart labels based on period
  const formatChartLabels = (
    labels: string[],
    period: "day" | "month" | "year"
  ): string[] => {
    return labels.map((label) => {
      const date = new Date(label);
      switch (period) {
        case "day":
          return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          });
        case "month":
          return date.toLocaleDateString("vi-VN", {
            month: "2-digit",
            year: "numeric",
          });
        case "year":
          return date.getFullYear().toString();
        default:
          return label;
      }
    });
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!revenueChartData?.data) {
      return null;
    }

    const period = timeFilter === "year" ? "month" : "day";
    const formattedLabels = formatChartLabels(
      revenueChartData.data.labels,
      period
    );

    return {
      labels: formattedLabels,
      datasets: revenueChartData.data.datasets.map((dataset) => ({
        ...dataset,
        tension: 0.4,
        fill: true,
      })),
    };
  }, [revenueChartData, timeFilter]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: function (context: {
            dataset: { label?: string };
            parsed: { y: number | null };
          }) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += formatPrice(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: function (value: string | number) {
            const numValue =
              typeof value === "string" ? parseFloat(value) : value;
            if (numValue >= 1000000) {
              return (numValue / 1000000).toFixed(1) + "M";
            } else if (numValue >= 1000) {
              return (numValue / 1000).toFixed(0) + "K";
            }
            return numValue.toString();
          },
          font: {
            size: 10,
          },
        },
      },
    },
  };

  // Calculate stats from real data
  const totalUsers = users.length;
  const totalListings = listings.length;
  const totalRevenue = systemWallet?.totalEarned || 0;
  const totalCompletedTransactions = completedTransactions.length;

  // Calculate listing types
  const carListings = useMemo(
    () => listings.filter((l) => l.type === "Car").length,
    [listings]
  );
  const batteryListings = useMemo(
    () => listings.filter((l) => l.type === "Battery").length,
    [listings]
  );
  const carPercentage =
    totalListings > 0 ? Math.round((carListings / totalListings) * 100) : 0;
  const batteryPercentage =
    totalListings > 0 ? Math.round((batteryListings / totalListings) * 100) : 0;

  // Calculate certified listings (Published status)
  const certifiedListings = useMemo(
    () => listings.filter((l) => l.status === "Published").length,
    [listings]
  );

  const stats = [
    {
      icon: Users,
      label: "Người dùng",
      value: formatNumber(totalUsers),
      color: "blue",
    },
    {
      icon: FileText,
      label: "Tin đăng",
      value: formatNumber(totalListings),
      color: "green",
    },
    {
      icon: DollarSign,
      label: "Doanh thu",
      value: formatPrice(totalRevenue),
      color: "purple",
    },
    {
      icon: CheckCircle,
      label: "GD thành công",
      value: formatNumber(totalCompletedTransactions),
      color: "orange",
    },
  ];

  const listingTypes = [
    { name: "Xe điện", value: carPercentage, color: "bg-blue-600" },
    { name: "Pin", value: batteryPercentage, color: "bg-green-600" },
  ];

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
          <p className="text-gray-600 mt-1">
            Thống kê và báo cáo về hoạt động nền tảng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 p-6"
              >
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}
                  >
                    <Icon className={`text-${stat.color}-600`} size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Doanh thu theo thời gian
              </h2>
              <div className="flex gap-2">
                {(["7days", "30days", "year"] as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      timeFilter === filter
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {filter === "7days" && "7 ngày"}
                    {filter === "30days" && "30 ngày"}
                    {filter === "year" && "Năm nay"}
                  </button>
                ))}
              </div>
            </div>
            {revenueLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : revenueError ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-red-600">
                  <p>{revenueError}</p>
                  <button
                    onClick={fetchRevenueChartData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : !chartData ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  Chưa có dữ liệu doanh thu
                </div>
              </div>
            ) : (
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}

            {/* Summary Section */}
            {revenueChartData?.data?.summary && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Tổng quan doanh thu
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Doanh thu giao dịch
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatPrice(
                        revenueChartData.data.summary.totalTransactionRevenue
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNumber(
                        revenueChartData.data.summary.totalTransactions
                      )}{" "}
                      giao dịch
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Doanh thu membership
                    </p>
                    <p className="text-sm font-semibold text-blue-600">
                      {formatPrice(
                        revenueChartData.data.summary.totalMembershipRevenue
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatNumber(
                        revenueChartData.data.summary.totalMemberships
                      )}{" "}
                      gói
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-xs text-gray-600 mb-1">Tổng doanh thu</p>
                    <p className="text-sm font-semibold text-purple-600">
                      {formatPrice(revenueChartData.data.summary.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tổng giao dịch</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatNumber(
                        revenueChartData.data.summary.totalTransactions
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Tổng membership
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatNumber(
                        revenueChartData.data.summary.totalMemberships
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Loại tin đăng
            </h2>
            <div className="space-y-6">
              <div className="relative w-48 h-48 mx-auto">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="20"
                    strokeDasharray={`${listingTypes[0].value * 2.51} ${
                      (100 - listingTypes[0].value) * 2.51
                    }`}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="20"
                    strokeDasharray={`${listingTypes[1].value * 2.51} ${
                      (100 - listingTypes[1].value) * 2.51
                    }`}
                    strokeDashoffset={`${-listingTypes[0].value * 2.51}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {totalListings}
                    </p>
                    <p className="text-sm text-gray-600">Tổng tin</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {listingTypes.map((type, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${type.color}`}></div>
                      <span className="text-gray-700">{type.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {type.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Giao dịch thành công gần nhất
            </h2>
            <div className="space-y-4">
              {completedTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có giao dịch thành công nào
                </div>
              ) : (
                completedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.listing.make && transaction.listing.model
                          ? `${transaction.listing.make} ${transaction.listing.model}`
                          : transaction.listing.title || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transaction.counterparty.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(transaction.amount.total)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(
                          transaction.dates?.completedAt ||
                            transaction.dates?.createdAt ||
                            new Date().toISOString()
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                Tin đã kiểm định
              </h2>
            </div>
            <div className="text-center py-8">
              <div className="inline-flex w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Award className="text-blue-600" size={48} />
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                {certifiedListings}
              </p>
              <p className="text-gray-600">
                Tin đăng đã được kiểm định chất lượng
              </p>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tỷ lệ kiểm định</span>
                  <span className="font-semibold text-blue-600">
                    {totalListings > 0
                      ? Math.round((certifiedListings / totalListings) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
