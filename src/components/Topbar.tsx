import { useState, useEffect } from "react";
import { Search, Bell, LogOut, User, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usersService } from "../services/api";

export default function Topbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const user = localStorage.getItem("user");
    if (user) {
      try {
        setUserInfo(JSON.parse(user));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Gọi API signout
      await usersService.signOut();

      // Xóa tất cả dữ liệu khỏi localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Đóng modal và redirect
      setShowLogoutModal(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Vẫn xóa localStorage và redirect ngay cả khi API lỗi
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setShowLogoutModal(false);
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  {userInfo?.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-medium">
                      {userInfo?.fullName?.charAt(0) || "A"}
                    </span>
                  )}
                </div>
                {userInfo?.fullName && (
                  <span className="text-sm font-medium text-gray-700">
                    {userInfo.fullName}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <User size={16} />
                    Hồ sơ cá nhân
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Settings size={16} />
                    Cài đặt
                  </button>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xác nhận đăng xuất
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
