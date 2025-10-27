import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { authService } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await authService.login(email, password);

      if (data.accessToken) {
        // Kiểm tra role của user
        if (data.user && data.user.role !== "admin") {
          setError(
            "Bạn không có quyền truy cập vào trang quản trị. Chỉ quản trị viên mới được phép đăng nhập."
          );
          return;
        }

        // Lưu accessToken vào localStorage
        localStorage.setItem("token", data.accessToken);

        // Lưu refreshToken nếu có
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }

        // Lưu thông tin user nếu có
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // Điều hướng đến dashboard
        navigate("/dashboard");
      } else {
        setError("Email hoặc mật khẩu không đúng");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra. Vui lòng thử lại."
      );
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">EV</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Đăng nhập Admin
          </h1>
          <p className="text-gray-600">
            Quản trị nền tảng mua bán xe điện & pin
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="hoibien9804@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Nhớ mật khẩu</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">Chưa có tài khoản? </span>
            <Link
              to="/register"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
