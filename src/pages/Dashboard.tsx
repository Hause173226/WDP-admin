import Layout from "../components/Layout";
import {
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  Award,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  usersService,
  transactionsService,
  listingsService,
  systemWalletService,
} from "../services/api";
import { User, Transaction, Listing, SystemWallet } from "../types";

type TimeFilter = "7days" | "30days" | "year";

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7days");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [completedTransactions, setCompletedTransactions] = useState<
    Transaction[]
  >([]);
  const [allCompletedTransactions, setAllCompletedTransactions] = useState<
    Transaction[]
  >([]);
  const [systemWallet, setSystemWallet] = useState<SystemWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
            a.dates.completedAt || a.dates.createdAt
          ).getTime();
          const dateB = new Date(
            b.dates.completedAt || b.dates.createdAt
          ).getTime();
          return dateB - dateA;
        });
        setAllCompletedTransactions(completed);
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

  // Calculate revenue data from completed transactions
  const revenueData = useMemo(() => {
    if (allCompletedTransactions.length === 0) {
      return [];
    }

    const now = new Date();
    let startDate: Date;
    let periodCount: number;
    let periodLabel: (date: Date) => string;

    switch (timeFilter) {
      case "7days":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6); // 7 days including today
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
        startDate.setDate(startDate.getDate() - 29); // 30 days including today
        periodCount = 30;
        periodLabel = (date: Date) => {
          return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          });
        };
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1); // Start of year
        periodCount = 12;
        periodLabel = (date: Date) => {
          return date.toLocaleDateString("vi-VN", { month: "2-digit" });
        };
        break;
      default:
        return [];
    }

    // Initialize revenue map
    const revenueMap = new Map<string, number>();

    // Initialize all periods with 0 revenue
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

    // Calculate revenue from completed transactions
    allCompletedTransactions.forEach((transaction) => {
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

    // Convert map to array and sort by date
    return Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({
        date,
        revenue,
      }))
      .sort((a, b) => {
        // Sort by date string (works for day/month format)
        return a.date.localeCompare(b.date);
      });
  }, [allCompletedTransactions, timeFilter]);

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
      change: "+12%",
      isPositive: true,
      color: "blue",
    },
    {
      icon: FileText,
      label: "Tin đăng",
      value: formatNumber(totalListings),
      change: "+8%",
      isPositive: true,
      color: "green",
    },
    {
      icon: DollarSign,
      label: "Doanh thu",
      value: formatPrice(totalRevenue),
      change: "+15%",
      isPositive: true,
      color: "purple",
    },
    {
      icon: CheckCircle,
      label: "GD thành công",
      value: formatNumber(totalCompletedTransactions),
      change: "+5%",
      isPositive: true,
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
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}
                  >
                    <Icon className={`text-${stat.color}-600`} size={24} />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stat.isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.isPositive ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                    {stat.change}
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
            <div className="h-64 flex items-end justify-between gap-2">
              {revenueData.length === 0 ? (
                <div className="w-full text-center py-8 text-gray-500">
                  Chưa có dữ liệu doanh thu
                </div>
              ) : (
                revenueData.map((data, index) => {
                  const maxRevenue = Math.max(
                    ...revenueData.map((d) => d.revenue),
                    1 // Avoid division by zero
                  );
                  const height =
                    maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-full bg-gray-100 rounded-t-lg relative group cursor-pointer hover:bg-blue-50 transition-colors"
                        style={{
                          height: `${height}%`,
                          minHeight: height > 0 ? "4px" : "0",
                        }}
                      >
                        <div
                          className="absolute inset-0 bg-blue-600 rounded-t-lg"
                          style={{ height: "100%" }}
                        ></div>
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {formatPrice(data.revenue)}
                        </div>
                      </div>
                      <span className="text-xs text-gray-600">{data.date}</span>
                    </div>
                  );
                })
              )}
            </div>
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
                          transaction.dates.completedAt ||
                            transaction.dates.createdAt
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
