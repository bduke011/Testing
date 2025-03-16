
import React, { useState, useEffect } from "react";
import { Listing, User, Bid } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Search, Clock, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadListings();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadListings = async () => {
    setError(null);
    try {
      const items = await Listing.list();

      const validListings = items.filter(item => 
        item && 
        item.status === "active" && 
        item.title && 
        item.starting_price && 
        new Date(item.end_date) > new Date()
      );

      setListings(validListings);
    } catch (error) {
      console.error("Error loading listings:", error);
      setError("Unable to load listings. Please try refreshing the page.");
      setListings([]);
    }
    setLoading(false);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(search.toLowerCase()) ||
                         listing.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || listing.category === category;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center text-gray-500">Loading listings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2841]">Active Auctions</h1>
          <p className="text-gray-500">
            {!user ? (
              <span className="text-[#F4812C] font-medium">Sign in to place bids</span>
            ) : (
              "Browse and bid on available items"
            )}
          </p>
        </div>
        <div className="w-full md:w-auto flex gap-4">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-[#1B2841]/20 focus:border-[#F4812C] focus:ring-[#F4812C]"
            />
          </div>
          <Tabs value={category} onValueChange={setCategory} className="border-[#F4812C]">
            <TabsList className="bg-[#1B2841]/5">
              <TabsTrigger 
                value="all"
                className="data-[state=active]:bg-[#F4812C] data-[state=active]:text-white"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="electronics"
                className="data-[state=active]:bg-[#F4812C] data-[state=active]:text-white"
              >
                Electronics
              </TabsTrigger>
              <TabsTrigger 
                value="collectibles"
                className="data-[state=active]:bg-[#F4812C] data-[state=active]:text-white"
              >
                Collectibles
              </TabsTrigger>
              <TabsTrigger 
                value="fashion"
                className="data-[state=active]:bg-[#F4812C] data-[state=active]:text-white"
              >
                Fashion
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing) => (
          <Link 
            key={listing.id} 
            to={createPageUrl(`Listing?id=${listing.id}`)}
            className="group"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow border-[#1B2841]/10 hover:border-[#F4812C]/50">
              <div className="aspect-video relative overflow-hidden bg-[#1B2841]/5">
                {listing.images?.[0] ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#1B2841]/5">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#1B2841]/40">
                    No image available
                  </div>
                )}
                <Badge 
                  className="absolute top-2 right-2 bg-white text-[#1B2841] border border-gray-200"
                >
                  {listing.bids?.length > 0 ? (
                    <span>
                      {listing.bids[0].created_by.substring(0, 4)}*** ${listing.current_price.toFixed(2)}
                    </span>
                  ) : (
                    <span>Starting ${listing.starting_price.toFixed(2)}</span>
                  )}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold text-[#1B2841] mb-2 line-clamp-1">
                  {listing.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-[#1B2841]/60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-[#F4812C]" />
                    {format(new Date(listing.end_date), "MMM d, h:mma")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4 text-[#F4812C]" />
                    {listing.category}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredListings.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg border border-[#1B2841]/10">
          <h3 className="text-lg font-medium text-[#1B2841] mb-2">No listings found</h3>
          <p className="text-[#1B2841]/60">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
