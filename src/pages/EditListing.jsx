
import React, { useState, useEffect } from "react";
import { Listing } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Save, ArrowLeft } from "lucide-react";
import ImageUpload from "../components/listings/ImageUpload";

export default function EditListing() {
  const navigate = useNavigate();
  const [listing, setListing] = useState({
    title: "",
    description: "",
    starting_price: "",
    bid_increment: "",
    buy_now_price: "",
    end_date: "",
    category: "",
    condition: "",
    images: [],
    payment_methods: {
      paypal: true,
      cashapp: true,
      venmo: true,
      bank_transfer: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadListing();
  }, []);

  const loadListing = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    setLoading(true);
    try {
      const listingData = await Listing.get(id);
      if (!listingData) {
        setError("Listing not found");
        setListing(null);
        return;
      }

      if (!listingData.payment_methods) {
        listingData.payment_methods = {
          paypal: true,
          cashapp: true,
          venmo: true,
          bank_transfer: true
        };
      }

      setListing({
        ...listingData,
        end_date: new Date(listingData.end_date).toISOString().slice(0, 16)
      });
    } catch (error) {
      console.error("Error loading listing:", error);
      setError("Unable to load listing. Please try refreshing the page.");
    }
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setListing(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (newImages) => {
    setListing(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handlePaymentMethodChange = (method) => {
    setListing(prev => ({
      ...prev,
      payment_methods: {
        ...prev.payment_methods,
        [method]: !prev.payment_methods[method]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await Listing.update(listing.id, {
      ...listing,
      starting_price: parseFloat(listing.starting_price),
      bid_increment: parseFloat(listing.bid_increment),
      buy_now_price: listing.buy_now_price ? parseFloat(listing.buy_now_price) : null,
    });
    navigate(createPageUrl("AdminListings"));
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(createPageUrl("AdminListings"))}
          className="text-[#1B2841]"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-[#1B2841]">Edit Listing</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading listing...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Photos</Label>
                <ImageUpload
                  images={listing.images}
                  onChange={handleImageChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={listing.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Enter listing title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={listing.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Enter listing description"
                  className="h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starting_price">Starting Price ($)</Label>
                  <Input
                    id="starting_price"
                    type="number"
                    value={listing.starting_price}
                    onChange={(e) => handleChange("starting_price", e.target.value)}
                    placeholder="0.00"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bid_increment">Bid Increment ($)</Label>
                  <Input
                    id="bid_increment"
                    type="number"
                    value={listing.bid_increment}
                    onChange={(e) => handleChange("bid_increment", e.target.value)}
                    placeholder="0.00"
                    required
                    min="0.01"
                    step="0.01"
                  />
                  <p className="text-sm text-[#1B2841]/60">
                    Minimum amount each new bid must increase by
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buy_now_price">Buy Now Price ($)</Label>
                  <Input
                    id="buy_now_price"
                    type="number"
                    value={listing.buy_now_price}
                    onChange={(e) => handleChange("buy_now_price", e.target.value)}
                    placeholder="0.00"
                    min={listing.starting_price || 0}
                    step="0.01"
                  />
                  <p className="text-sm text-[#1B2841]/60">
                    Optional. Must be higher than starting price
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={listing.end_date}
                    onChange={(e) => handleChange("end_date", e.target.value)}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={listing.category}
                    onValueChange={(value) => handleChange("category", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="collectibles">Collectibles</SelectItem>
                      <SelectItem value="fashion">Fashion</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select
                    value={listing.condition}
                    onValueChange={(value) => handleChange("condition", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="for_parts">For Parts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Methods</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="paypal"
                      checked={listing.payment_methods?.paypal}
                      onChange={() => handlePaymentMethodChange("paypal")}
                      className="rounded border-gray-300 text-[#F4812C] focus:ring-[#F4812C]"
                    />
                    <Label htmlFor="paypal" className="cursor-pointer">PayPal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cashapp"
                      checked={listing.payment_methods?.cashapp}
                      onChange={() => handlePaymentMethodChange("cashapp")}
                      className="rounded border-gray-300 text-[#F4812C] focus:ring-[#F4812C]"
                    />
                    <Label htmlFor="cashapp" className="cursor-pointer">Cash App</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="venmo"
                      checked={listing.payment_methods?.venmo}
                      onChange={() => handlePaymentMethodChange("venmo")}
                      className="rounded border-gray-300 text-[#F4812C] focus:ring-[#F4812C]"
                    />
                    <Label htmlFor="venmo" className="cursor-pointer">Venmo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="bank_transfer"
                      checked={listing.payment_methods?.bank_transfer}
                      onChange={() => handlePaymentMethodChange("bank_transfer")}
                      className="rounded border-gray-300 text-[#F4812C] focus:ring-[#F4812C]"
                    />
                    <Label htmlFor="bank_transfer" className="cursor-pointer">Bank Transfer</Label>
                  </div>
                </div>
                <p className="text-sm text-[#1B2841]/60">
                  Select which payment methods you'll accept for this item
                </p>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-100 px-4 py-2 h-10 whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
