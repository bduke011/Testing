

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Home, 
  Package, 
  Gavel, 
  User, 
  UserX, 
  Settings, 
  UserCircle, 
  Menu,
  X,
  Wallet,
  LogOut,
  FileText,
  LayoutDashboard,
  Users,
  Mail,
  CreditCard
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { User as UserEntity } from "@/api/entities";
import NotificationBell from "./components/notifications/NotificationBell";
import ErrorBoundary from "./components/ErrorBoundary";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await UserEntity.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setLoading(false);
  };

  const doLogout = () => {
    window.location.href = '/auth/logout?redirect=/'; 
  };

  const NavLinks = ({ isMobile = false }) => (
    <>
      <Link 
        to={createPageUrl("Dashboard")}
        className={`flex items-center gap-2 text-[#F4812C] hover:text-[#F4B41A] text-sm transition-colors ${isMobile ? 'py-3' : ''}`}
        onClick={() => setSidebarOpen(false)}
      >
        <Home className="w-4 h-4" />
        Home
      </Link>

      {user?.role === "admin" && (
        <>
          <Link 
            to={createPageUrl("AdminListings")}
            className={`flex items-center gap-2 text-[#F4812C] hover:text-[#F4B41A] text-sm transition-colors ${isMobile ? 'py-3' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Package className="w-4 h-4" />
            Manage Listings
          </Link>
          <Link 
            to={createPageUrl("ManageUsers")}
            className={`flex items-center gap-2 text-[#F4812C] hover:text-[#F4B41A] text-sm transition-colors ${isMobile ? 'py-3' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users className="w-4 h-4" />
            Manage Users
          </Link>
          <Link 
            to={createPageUrl("PaymentSettings")}
            className={`flex items-center gap-2 text-[#F4812C] hover:text-[#F4B41A] text-sm transition-colors ${isMobile ? 'py-3' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Wallet className="w-4 h-4" />
            Payment Settings
          </Link>
          <Link
            to={createPageUrl("EmailTemplates")}
            className={`flex items-center gap-2 text-[#F4812C] hover:text-[#F4B41A] text-sm transition-colors ${isMobile ? 'py-3' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Mail className="w-4 h-4" />
            Email Templates
          </Link>
        </>
      )}

      {user && (
        <>
          <Link 
            to={createPageUrl("MyBids")}
            className={`flex items-center gap-2 text-[#F4812C] hover:text-[#F4B41A] text-sm transition-colors ${isMobile ? 'py-3' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Gavel className="w-4 h-4" />
            My Bids
          </Link>
          <Link 
            to={createPageUrl("Account")}
            className={`flex items-center gap-2 text-[#F4812C] hover:text-[#F4B41A] text-sm transition-colors ${isMobile ? 'py-3' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <UserCircle className="w-4 h-4" />
            My Account
          </Link>
        </>
      )}

      {user?.role === "admin" && (
        <Link
          to={createPageUrl("CreateListing")}
          className={`flex items-center gap-2 bg-[#F4812C] text-white px-3 py-1.5 rounded-lg hover:bg-[#F4B41A] text-sm transition-colors ${isMobile ? 'mt-2' : 'ml-2'}`}
          onClick={() => setSidebarOpen(false)}
        >
          <PlusCircle className="w-4 h-4" />
          Create Listing
        </Link>
      )}

      {!user ? (
        <Link to={createPageUrl("Login")}>
          <Button className={`bg-[#F4812C] hover:bg-[#F4B41A] flex items-center gap-2 text-sm ${isMobile ? 'w-full mt-2' : ''}`}>
            <User className="w-4 h-4" />
            Sign In to Bid
          </Button>
        </Link>
      ) : (
        <Button 
          variant="ghost" 
          onClick={doLogout}
          className="flex items-center gap-2 text-[#F4812C] hover:text-[#F4B41A] text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      )}
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1B2841]/5 flex items-center justify-center">
        <div className="animate-pulse text-[#F4812C]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1B2841]/5">
      <header className="bg-white border-b border-[#F4812C]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link
                to={createPageUrl("Dashboard")}
                className="flex items-center gap-2 text-[#1B2841] hover:text-[#F4812C] transition-colors"
              >
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/41eca7_image.png"
                  alt="TruBid"
                  className="h-8 w-auto"
                />
                <span className="text-lg font-bold">
                  TruBid
                </span>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center gap-4">
              <NavLinks />
              {user && (
                <ErrorBoundary fallback={<div className="w-10 h-10"></div>}>
                  <NotificationBell />
                </ErrorBoundary>
              )}
            </nav>

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    <Menu className="w-6 h-6 text-[#F4812C]" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/41eca7_image.png" 
                        alt="TruBid" 
                        className="h-12 w-auto"
                      />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col py-6">
                    <NavLinks isMobile />
                    {user && (
                      <ErrorBoundary fallback={null}>
                        <NotificationBell />
                      </ErrorBoundary>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

