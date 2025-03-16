
import React, { useState, useEffect } from "react";
import { Bid, Listing, User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Clock, DollarSign, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [listings, setListings] = useState({});
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBids();
  }, []);

  const loadBids = async () => {
    setError(null);
    try {
      const user = await User.me();
      if (!user) return;

      const userBids = await Bid.filter({ created_by: user.email }, "-created_date");
      
      const validBidsAndListings = await Promise.all(
        userBids.map(async (bid) => {
          try {
            const listing = await Listing.get(bid.listing_id);
            return { bid, listing };
          } catch (error) {
            if (error.error_type === "ObjectNotFoundError") {
              try {
                await Bid.delete(bid.id);
              } catch (deleteError) {
                console.error("Error deleting orphaned bid:", deleteError);
              }
            }
            return null;
          }
        })
      );

      const validEntries = validBidsAndListings.filter(entry => entry !== null);
      
      const validBids = validEntries.map(entry => entry.bid);
      const listingsMap = validEntries.reduce((acc, entry) => {
        acc[entry.listing.id] = entry.listing;
        return acc;
      }, {});

      setBids(validBids);
      setListings(listingsMap);
    } catch (error) {
      console.error("Error loading bids:", error);
      setError("Unable to load bids. Please try refreshing the page.");
      setBids([]);
      setListings({});
    }
    setLoading(false);
  };

  const filterBids = () => {
    return bids.filter(bid => {
      const listing = listings[bid.listing_id];
      if (!listing) return false;

      const isEnded = new Date(listing.end_date) < new Date();
      const isHighestBid = listing.current_price === bid.amount;

      switch (filter) {
        case "active":
          return !isEnded;
        case "won":
          return isEnded && isHighestBid;
        case "lost":
          return isEnded && !isHighestBid;
        default:
          return true;
      }
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading your bids...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  const filteredBids = filterBids();

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
          <p className="text-gray-500">Track your auction activity</p>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="active">Active Bids</TabsTrigger>
            <TabsTrigger value="won">Won</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {filteredBids.map((bid) => {
          const listing = listings[bid.listing_id];
          if (!listing) return null;

          const isEnded = new Date(listing.end_date) < new Date();
          const isHighestBid = listing.current_price === bid.amount;

          return (
            <Link 
              key={bid.id}
              to={createPageUrl(`Listing?id=${listing.id}`)}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Your bid: ${bid.amount.toFixed(2)}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {listing.category}
                        </Badge>
                        <Badge 
                          variant={isEnded ? "secondary" : "outline"}
                          className="flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          {isEnded ? "Ended" : format(new Date(listing.end_date), "MMM d, h:mma")}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        Bid placed on {format(new Date(bid.created_date), "MMM d, yyyy 'at' h:mma")}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <div className="text-sm text-gray-500 mb-1">Current Price</div>
                      <div className="font-bold text-lg">
                        ${listing.current_price.toFixed(2)}
                      </div>
                      {isEnded && (
                        <Badge 
                          className={isHighestBid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {isHighestBid ? "Won" : "Lost"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {filteredBids.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bids found</h3>
              <p className="text-gray-500">
                {filter === "active" ? "You don't have any active bids" : "You haven't won or lost any auctions yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
