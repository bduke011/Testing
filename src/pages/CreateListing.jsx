
import React, { useState } from "react";
import { Listing, EmailTemplate, User } from "@/api/entities";
import { InvokeLLM, SendEmail } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Wand, Loader2 } from "lucide-react";
import ImageUpload from "../components/listings/ImageUpload";

export default function CreateListing() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const improveWithAI = async () => {
    if (!listing.title) return;

    setLoading(true);
    try {
      const result = await InvokeLLM({
        prompt: `Given this auction listing title: "${listing.title}"
                Please generate:
                1. A detailed, professional item description
                2. A suggested starting price based on market value
                Format as JSON with keys: description, suggested_price`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            suggested_price: { type: "number" }
          }
        }
      });

      setListing(prev => ({
        ...prev,
        description: result.description,
        starting_price: result.suggested_price
      }));
    } catch (error) {
      console.error("Error improving listing:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const startingPrice = parseFloat(listing.starting_price);
      const bidIncrement = parseFloat(listing.bid_increment);
      const buyNowPrice = listing.buy_now_price ? parseFloat(listing.buy_now_price) : null;
      
      if (isNaN(startingPrice) || startingPrice <= 0) {
        setError("Starting price must be greater than zero");
        return;
      }
      
      if (isNaN(bidIncrement) || bidIncrement <= 0) {
        setError("Bid increment must be greater than zero");
        return;
      }
      
      if (buyNowPrice !== null && (isNaN(buyNowPrice) || buyNowPrice <= startingPrice)) {
        setError("Buy now price must be greater than starting price");
        return;
      }

      const endDate = new Date(listing.end_date);
      if (isNaN(endDate.getTime()) || endDate <= new Date()) {
        setError("End date must be in the future");
        return;
      }

      const newListing = await Listing.create({
        ...listing,
        status: "active",
        starting_price: startingPrice,
        current_price: startingPrice,
        bid_increment: bidIncrement,
        buy_now_price: buyNowPrice,
        payment_methods: listing.payment_methods
      });

      try {
        const templates = await EmailTemplate.list();
        const template = templates.find(t => t.template_type === "listing_created");

        if (template) {
          const currentUser = await User.me();
          const emailData = {
            seller_name: currentUser.full_name || currentUser.email.split('@')[0],
            item_title: listing.title,
            start_price: startingPrice.toFixed(2),
            listing_url: `${window.location.origin}${createPageUrl(`Listing?id=${newListing.id}`)}`
          };

          let subject = template.subject;
          let body = template.body;
          
          Object.keys(emailData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, emailData[key]);
            body = body.replace(regex, emailData[key]);
          });

          await SendEmail({
            to: currentUser.email,
            from: template.from_email,
            subject: subject,
            body: body
          });
        }
      } catch (emailError) {
        console.error("Error sending creation notification:", emailError);
      }

      navigate(createPageUrl(`Listing?id=${newListing.id}`));
    } catch (error) {
      console.error("Error creating listing:", error);
      setError("Error creating listing. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Listing</CardTitle>
        </CardHeader>
        <CardContent>
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
              <div className="flex gap-2">
                <Input
                  id="title"
                  value={listing.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="What are you selling?"
                  required
                />
                <Button
                  type="button"
                  onClick={improveWithAI}
                  disabled={loading || !listing.title}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand className="w-4 h-4" />
                  )}
                  Improve with AI
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={listing.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe your item in detail"
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
                  min="0.01"
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
                    checked={listing.payment_methods.paypal}
                    onChange={() => handlePaymentMethodChange("paypal")}
                    className="rounded border-gray-300 text-[#F4812C] focus:ring-[#F4812C]"
                  />
                  <Label htmlFor="paypal" className="cursor-pointer">PayPal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="cashapp"
                    checked={listing.payment_methods.cashapp}
                    onChange={() => handlePaymentMethodChange("cashapp")}
                    className="rounded border-gray-300 text-[#F4812C] focus:ring-[#F4812C]"
                  />
                  <Label htmlFor="cashapp" className="cursor-pointer">Cash App</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="venmo"
                    checked={listing.payment_methods.venmo}
                    onChange={() => handlePaymentMethodChange("venmo")}
                    className="rounded border-gray-300 text-[#F4812C] focus:ring-[#F4812C]"
                  />
                  <Label htmlFor="venmo" className="cursor-pointer">Venmo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bank_transfer"
                    checked={listing.payment_methods.bank_transfer}
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

            <Button type="submit" className="w-full">
              Create Listing
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
