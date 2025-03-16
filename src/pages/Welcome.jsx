import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User as UserIcon, ArrowRight, ShoppingBag, Gavel, Award } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    try {
      // This will redirect to the login page if not logged in
      await User.login();
    } catch (error) {
      console.error("Login redirect error:", error);
    }
  };
  
  const goToDashboard = () => {
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center bg-gradient-to-b from-[#1B2841]/5 to-white px-4">
      <div className="text-center mb-8">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/41eca7_image.png" 
          alt="TruBid" 
          className="h-20 w-auto mx-auto mb-6"
        />
        <h1 className="text-4xl font-bold text-[#1B2841] mb-4">Welcome to TruBid</h1>
        <p className="text-xl text-[#1B2841]/70 max-w-2xl mx-auto">
          The trusted platform for online auctions and bidding
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-12">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-[#F4812C]/10 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6 text-[#F4812C]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Browse Listings</h3>
            <p className="text-[#1B2841]/70">
              Explore a wide variety of items available for auction
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-[#F4812C]/10 rounded-full flex items-center justify-center mb-4">
              <Gavel className="w-6 h-6 text-[#F4812C]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Place Bids</h3>
            <p className="text-[#1B2841]/70">
              Bid on items and compete to win auctions
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-[#F4812C]/10 rounded-full flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-[#F4812C]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Win Auctions</h3>
            <p className="text-[#1B2841]/70">
              Secure great deals on unique and valuable items
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={handleLogin}
          className="bg-[#F4812C] hover:bg-[#F4B41A] min-w-[150px] flex items-center gap-2"
          size="lg"
        >
          <UserIcon className="w-5 h-5" />
          Sign In
        </Button>
        
        <Button 
          onClick={goToDashboard}
          variant="outline" 
          className="border-[#F4812C] text-[#F4812C] hover:bg-[#F4812C]/10 min-w-[150px] flex items-center gap-2"
          size="lg"
        >
          Browse Auctions
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}