import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Receipt, DollarSign, BarChart3 } from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Trang chủ' },
  { path: '/users', icon: Users, label: 'Người dùng' },
  { path: '/listings', icon: FileText, label: 'Tin đăng' },
  { path: '/transactions', icon: Receipt, label: 'Giao dịch' },
  { path: '/fees', icon: DollarSign, label: 'Phí & Hoa hồng' },
  { path: '/reports', icon: BarChart3, label: 'Báo cáo' }
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">EV</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">EV Market</h1>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
