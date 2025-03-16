
import React, { useState, useEffect } from "react";
import { User, Bid, Listing } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { UserCircle, Clock, DollarSign, Gavel, Mail, Calendar, AlertCircle, Save, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Account() {
  const [user, setUser] = useState(null);
  const [bids, setBids] = useState([]);
  const [listings, setListings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      if (!userData) return;
      setUser(userData);
      setFullName(userData.full_name || "");

      const userBids = await Bid.filter({ created_by: userData.email }, "-created_date");
      
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
      console.error("Error loading user data:", error);
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    try {
      await User.updateMyUserData({ full_name: fullName });
      setSaveMessage({ type: "success", text: "Profile updated successfully" });
      setEditing(false);
      loadUserData();
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveMessage({ type: "error", text: "Error updating profile" });
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const activeBids = bids.filter(bid => {
    const listing = listings[bid.listing_id];
    return listing && new Date(listing.end_date) > new Date();
  });

  const wonBids = bids.filter(bid => {
    const listing = listings[bid.listing_id];
    return listing && 
           new Date(listing.end_date) < new Date() && 
           listing.current_price === bid.amount;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B2841]">My Account</h1>
        <p className="text-[#1B2841]/60">Manage your account and view your bidding history</p>
      </div>

      {saveMessage && (
        <Alert 
          variant={saveMessage.type === "success" ? "default" : "destructive"}
          className="mb-6"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveMessage.text}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#1B2841]/5 mb-6">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-[#F4812C] data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="active-bids"
            className="data-[state=active]:bg-[#F4812C] data-[state=active]:text-white"
          >
            Active Bids
          </TabsTrigger>
          <TabsTrigger 
            value="won"
            className="data-[state=active]:bg-[#F4812C] data-[state=active]:text-white"
          >
            Won Auctions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-[#F4812C]" />
                    Account Details
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-[#1B2841]/60">Name</Label>
                  {editing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUpdateProfile}
                        className="border-gray-300 hover:bg-gray-100 px-4 py-2 h-10 whitespace-nowrap flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditing(false);
                          setFullName(user.full_name || "");
                        }}
                        className="border-gray-300 hover:bg-gray-100 px-4 py-2 h-10 whitespace-nowrap"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-medium">
                        {user.full_name || (
                          <span className="text-[#1B2841]/40 italic">Name not set</span>
                        )}
                      </p>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditing(true)}
                        className="text-[#F4812C] border-[#F4812C] hover:bg-[#F4812C] hover:text-white flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Name
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-[#1B2841]/60">Email</Label>
                  <p className="font-medium flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-[#F4812C]" />
                    {user.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-[#1B2841]/60">Member Since</Label>
                  <p className="font-medium flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-[#F4812C]" />
                    {format(new Date(user.created_date), "MMMM d, yyyy")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-[#F4812C]" />
                  Bidding Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#1B2841]/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#F4812C]" />
                    <span>Active Bids</span>
                  </div>
                  <Badge variant="secondary">{activeBids.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1B2841]/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#F4812C]" />
                    <span>Won Auctions</span>
                  </div>
                  <Badge variant="secondary">{wonBids.length}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active-bids">
          <div className="space-y-4">
            {activeBids.map((bid) => {
              const listing = listings[bid.listing_id];
              if (!listing) return null;
              
              return (
                <Link 
                  key={bid.id}
                  to={createPageUrl(`Listing?id=${listing.id}`)}
                  className="block"
                >
                  <div className="p-4 border rounded-lg bg-white">
                    <h2 className="text-lg font-semibold">{listing.title}</h2>
                    <p>Bid Amount: ${bid.amount}</p>
                    <p>End Date: {format(new Date(listing.end_date), "MMMM d, yyyy HH:mm")}</p>
                  </div>
                </Link>
              );
            })}
            {activeBids.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active bids</h3>
                <p className="text-gray-500">You don't have any active bids at the moment</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="won">
          <div className="space-y-4">
            {wonBids.map((bid) => {
              const listing = listings[bid.listing_id];
              if (!listing) return null;

              return (
                <div key={bid.id} className="p-4 border rounded-lg bg-white">
                  <h2 className="text-lg font-semibold">{listing.title}</h2>
                  <p>Bid Amount: ${bid.amount}</p>
                  <p>Won On: {format(new Date(listing.end_date), "MMMM d, yyyy HH:mm")}</p>
                </div>
              );
            })}
            {wonBids.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No won auctions</h3>
                <p className="text-gray-500">You haven't won any auctions yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
