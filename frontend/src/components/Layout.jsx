import React, { useState } from 'react';
import { User, Users, Calendar, MapPin, FileText, LogOut, Menu, X, Radio } from 'lucide-react';

const Layout = ({ children, admin, onLogout, currentPage, setCurrentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: User },
    { id: 'rfid', label: 'RFID Reader', icon: Radio },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-indigo-900/20 blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-full h-96 bg-blue-900/20 blur-3xl opacity-50"></div>
      </div>

      {/* Mobile menu */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 border-r border-slate-800 shadow-2xl transform transition ease-in-out duration-300">
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-slate-800 text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-6 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-6 mb-8">
                <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mr-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Student Security</h1>
                  <p className="text-xs text-slate-400 font-medium">Admin Dashboard</p>
                </div>
              </div>
              <nav className="px-3 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentPage(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`${
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 border-transparent'
                      } group flex items-center px-4 py-3 text-base font-medium rounded-xl border w-full transition-all duration-200`}
                    >
                      <Icon className={`${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} mr-4 h-6 w-6 transition-colors`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-slate-800 p-4 bg-slate-900/50">
              <div className="flex items-center w-full">
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{admin.username}</p>
                  <button
                    onClick={onLogout}
                    className="flex items-center text-xs text-slate-400 hover:text-red-400 mt-1 transition-colors"
                  >
                    <LogOut className="mr-1 h-3 w-3" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-10">
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800">
          <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6 mb-8">
              <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mr-3">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Student Security</h1>
                 <p className="text-xs text-slate-400 font-medium">Admin Dashboard</p>
              </div>
            </div>
            <nav className="flex-1 px-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-lg shadow-indigo-900/20'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 border-transparent'
                    } group flex items-center px-4 py-3 text-sm font-medium rounded-xl border w-full transition-all duration-200 relative overflow-hidden`}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-full"></div>}
                    <Icon className={`${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} mr-3 h-5 w-5 transition-colors`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-slate-800 p-4 bg-slate-900/50">
            <div className="flex items-center w-full px-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-white text-ellipsis overflow-hidden">{admin.username}</p>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                  <span className="text-xs text-slate-400">Online</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-72 flex flex-col flex-1 relative z-0">
        <div className="sticky top-0 z-20 md:hidden flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
           <div className="flex items-center">
             <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
               <User className="h-4 w-4 text-white" />
             </div>
             <span className="font-bold text-white">Student Security</span>
           </div>
          <button
            className="-mr-2 h-10 w-10 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;