
import React, { useState, useEffect } from "react";
import { Listing, User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Pencil, Plus, Search, Tag, Clock, DollarSign, ImagePlus, Trash2, Copy } from "lucide-react";
import ImageUpload from "../components/listings/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editingImages, setEditingImages] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    checkAdmin();
    loadListings();
  }, []);

  const checkAdmin = async () => {
    const userData = await User.me();
    setUser(userData);
    if (userData?.role !== "admin") {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const loadListings = async () => {
    const items = await Listing.list("-created_date");
    setListings(items);
    setLoading(false);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || listing.status === status;
    return matchesSearch && matchesStatus;
  });

  const handleImageUpdate = async (newImages) => {
    if (!selectedListing) return;
    
    try {
      await Listing.update(selectedListing.id, {
        ...selectedListing,
        images: newImages
      });
      loadListings();
      setEditingImages(false);
      setSelectedListing(null);
    } catch (error) {
      console.error("Error updating images:", error);
    }
  };

  const handleDeleteListing = async (listingId) => {
    try {
      await Listing.delete(listingId);
      loadListings(); // Reload the listings list after deletion
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  const handleDuplicateListing = async (originalListing) => {
    try {
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      
      const newListing = await Listing.create({
        ...originalListing,
        id: undefined,
        created_by: undefined,
        created_date: undefined,
        status: "active",
        current_price: originalListing.starting_price,
        end_date: oneMonthFromNow.toISOString().slice(0, 16),
        title: `${originalListing.title} (Copy)`
      });

      loadListings(); // Reload the listings list
    } catch (error) {
      console.error("Error duplicating listing:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Listings</h1>
          <p className="text-gray-500">Create and manage your auction listings</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button
            onClick={() => navigate(createPageUrl("CreateListing"))}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 bg-[#1B2841]/5 rounded-lg overflow-hidden flex-shrink-0">
                        {listing.images?.[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#1B2841]/40">
                            No image
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{listing.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(listing.end_date), "MMM d, h:mma")}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {listing.category}
                          </Badge>
                          <Badge 
                            className={
                              listing.status === "draft" ? "bg-gray-100 text-gray-800" :
                              listing.status === "active" ? "bg-green-100 text-green-800" :
                              "bg-red-100 text-red-800"
                            }
                          >
                            {listing.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedListing(listing);
                          setEditingImages(true);
                        }}
                        className="text-[#F4812C] border-[#F4812C] hover:bg-[#F4812C] hover:text-white"
                      >
                        <ImagePlus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(createPageUrl(`EditListing?id=${listing.id}`))}
                        className="border-gray-300 hover:bg-gray-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDuplicateListing(listing)}
                        className="border-gray-300 hover:bg-gray-100"
                        title="Duplicate Listing"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-red-200 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{listing.title}"? This action cannot be undone 
                              and will remove all associated bids.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteListing(listing.id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Delete Listing
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <DollarSign className="w-4 h-4" />
                    Current Price
                  </div>
                  <div className="font-bold text-lg">
                    ${(listing.current_price || listing.starting_price).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-500">Try adjusting your search or create a new listing</p>
          </div>
        )}
      </div>

      <Dialog open={editingImages} onOpenChange={setEditingImages}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Listing Images</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <ImageUpload
              images={selectedListing.images || []}
              onChange={handleImageUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
