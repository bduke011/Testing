
import React, { useState, useEffect } from "react";
import { Listing, Bid, User, EmailTemplate, PaymentSettings } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Clock, Tag, AlertCircle } from "lucide-react";
import PaymentForm from "../components/payments/PaymentForm";

export default function ListingPage() {
  const [listing, setListing] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    initializeEmailTemplates();
    let intervalId = null;
    
    const loadInitialData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");
      if (id) {
        await loadUser(); // Load user first
        await loadListing(id);
        intervalId = setInterval(() => checkAuctionStatus(id), 60000);
      }
    };
    
    loadInitialData();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const initializeEmailTemplates = async () => {
    try {
      const templates = await EmailTemplate.list();
      const defaultTemplates = {
        auction_won: {
          template_type: "auction_won",
          from_email: "no-reply@trubid.auction",
          subject: "Congratulations! You've won the auction",
          body: "Congratulations {{winner_name}}!\n\nYou've won the auction for {{item_title}} at ${{final_price}}.\n\nPayment Instructions:\n{{payment_instructions}}\n\nTransaction Details:\n{{transaction_details}}"
        },
        admin_notification: {
          template_type: "admin_notification",
          from_email: "no-reply@trubid.auction",
          subject: "Auction won notification",
          body: "Item: {{item_title}}\nFinal Price: ${{final_price}}\nWinner Email: {{winner_email}}\n\nAuction Details:\n{{auction_details}}"
        }
      };

      for (const [type, template] of Object.entries(defaultTemplates)) {
        const exists = templates.some(t => t.template_type === type);
        if (!exists) {
          try {
            await EmailTemplate.create(template);
            console.log(`Created default template for ${type}`);
          } catch (error) {
            console.error(`Error creating ${type} template:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error initializing email templates:", error);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadListing = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const listingData = await Listing.get(id);
      if (!listingData) {
        setError("Listing not found");
        setListing(null);
        return;
      }
      setListing(listingData);

      try {
        const bidsData = await Bid.filter({ listing_id: id }, "-created_date");
        setBids(bidsData);
      } catch (bidError) {
        console.error("Error loading bids:", bidError);
        setBids([]);
      }
    } catch (error) {
      console.error("Error loading listing:", error);
      setError("Unable to load listing. Please try refreshing the page.");
      setListing(null);
    }
    setLoading(false);
  };

  const sendWinnerEmail = async (winnerEmail, listingData, winAmount) => {
    try {
      const templates = await EmailTemplate.list();
      const template = templates.find(t => t.template_type === "auction_won");
      
      if (!template) {
        console.error("Auction won email template not found");
        return;
      }

      const paymentSettings = await PaymentSettings.list();
      let paymentInstructions = "Contact seller for payment details.";
      
      if (paymentSettings.length > 0) {
        const settings = paymentSettings[0];
        const instructions = [];
        
        instructions.push('<div style="font-family: Arial, sans-serif; margin: 20px 0;">');
        instructions.push('<h3 style="color: #1B2841; border-bottom: 1px solid #eee; padding-bottom: 10px;">Payment Options</h3>');
        
        const paymentMethods = listingData.payment_methods || {
          paypal: true,
          cashapp: true,
          venmo: true,
          bank_transfer: true
        };
        
        if (paymentMethods.paypal && settings.paypal_email) {
          instructions.push(
            '<div style="margin-bottom: 15px;">',
            '<strong style="color: #F4812C;">PayPal:</strong><br>',
            `Send payment to: <code>${settings.paypal_email}</code>`,
            '</div>'
          );
        }
        
        if (paymentMethods.cashapp && settings.cashapp_id) {
          instructions.push(
            '<div style="margin-bottom: 15px;">',
            '<strong style="color: #F4812C;">Cash App:</strong><br>',
            `Send to: <code>${settings.cashapp_id}</code>`,
            '<div style="margin-top: 10px;">',
            settings.cashapp_qr ? `<p>Scan this QR code to pay:</p><img src="${settings.cashapp_qr}" alt="Cash App QR Code" style="max-width: 200px; border: 1px solid #eee;">` : '',
            '</div>',
            '</div>'
          );
        }
        
        if (paymentMethods.venmo && settings.venmo_id) {
          instructions.push(
            '<div style="margin-bottom: 15px;">',
            '<strong style="color: #F4812C;">Venmo:</strong><br>',
            `Send to: <code>${settings.venmo_id}</code>`,
            '<div style="margin-top: 10px;">',
            settings.venmo_qr ? `<p>Scan this QR code to pay:</p><img src="${settings.venmo_qr}" alt="Venmo QR Code" style="max-width: 200px; border: 1px solid #eee;">` : '',
            '</div>',
            '</div>'
          );
        }
        
        if (paymentMethods.bank_transfer && settings.bank_name && settings.bank_account_number) {
          instructions.push(
            '<div style="margin-bottom: 15px;">',
            '<strong style="color: #F4812C;">Bank Transfer:</strong><br>',
            `Bank: ${settings.bank_name}<br>`,
            `Account Name: ${settings.bank_account_name || 'Not provided'}<br>`,
            `Account Number: ${settings.bank_account_number}<br>`,
            `Routing Number: ${settings.bank_routing_number || 'Not provided'}`,
            '</div>'
          );
        }
        
        if (settings.payment_instructions) {
          instructions.push(
            '<div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">',
            '<strong style="color: #1B2841;">Additional Instructions:</strong>',
            `<p>${settings.payment_instructions.replace(/\n/g, '<br>')}</p>`,
            '</div>'
          );
        }
        
        instructions.push('</div>');
        paymentInstructions = instructions.join('');
      }

      const transactionDetails = [
        '<div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #F4812C;">',
        `<strong>Item:</strong> ${listingData.title}<br>`,
        `<strong>Final Price:</strong> $${winAmount.toFixed(2)}<br>`,
        `<strong>Transaction Date:</strong> ${format(new Date(), "MMMM d, yyyy")}<br>`,
        `<strong>Reference:</strong> TRU-${listingData.id.substring(0, 8)}`,
        '</div>'
      ].join('');

      let subject = template.subject;
      let body = template.body;
      
      const emailData = {
        winner_name: winnerEmail.split('@')[0],
        item_title: listingData.title,
        final_price: winAmount.toFixed(2),
        payment_instructions: paymentInstructions,
        transaction_details: transactionDetails
      };

      Object.keys(emailData).forEach(key => {
        const regex = new RegExp('{{' + key + '}}', 'g');
        subject = subject.replace(regex, emailData[key]);
        body = body.replace(regex, emailData[key]);
      });

      await SendEmail({
        to: winnerEmail,
        subject: subject,
        body: body
      });
    } catch (error) {
      console.error("Error sending winner email:", error);
    }
  };

  const sendAdminNotification = async (listingData, winAmount, winnerEmail) => {
    try {
      const adminUsers = await User.filter({ role: "admin" });
      if (adminUsers.length === 0) return;
      
      const templates = await EmailTemplate.list();
      const template = templates.find(t => t.template_type === "admin_notification");
      if (!template) return;

      const recipientEmails = [...adminUsers.map(a => a.email)];
      if (listingData.created_by && !recipientEmails.includes(listingData.created_by)) {
        recipientEmails.push(listingData.created_by);
      }

      const auctionDetails = [
        '<div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #1B2841;">',
        `<strong>Item:</strong> ${listingData.title}<br>`,
        `<strong>Category:</strong> ${listingData.category || 'Not specified'}<br>`,
        `<strong>Final Price:</strong> $${winAmount.toFixed(2)}<br>`,
        `<strong>Buyer:</strong> ${winnerEmail}<br>`,
        `<strong>Auction ID:</strong> ${listingData.id}<br>`,
        `<strong>Date Ended:</strong> ${format(new Date(), "MMMM d, yyyy")}`,
        '</div>'
      ].join('');

      let subject = template.subject;
      let body = template.body;

      const emailData = {
        item_title: listingData.title,
        final_price: winAmount.toFixed(2),
        winner_email: winnerEmail,
        auction_details: auctionDetails
      };

      Object.keys(emailData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, emailData[key]);
        body = body.replace(regex, emailData[key]);
      });

      for (const email of recipientEmails) {
        await SendEmail({
          to: email,
          subject: subject,
          body: body
        });
      }
    } catch (error) {
      console.error("Error sending admin notifications:", error);
    }
  };

  const checkAuctionStatus = async (id) => {
    try {
      const listingData = await Listing.get(id);
      
      if (!listingData || listingData.status === "ended" || listingData.status === "sold") {
        return;
      }

      if (new Date(listingData.end_date) < new Date()) {
        try {
          const bidsData = await Bid.filter({ listing_id: id }, "-amount");
          
          await Listing.update(id, { 
            ...listingData, 
            status: "ended" 
          });

          if (bidsData && bidsData.length > 0) {
            const winningBid = bidsData[0];
            
            await Bid.update(winningBid.id, { status: "won" });
            for (let i = 1; i < bidsData.length; i++) {
              await Bid.update(bidsData[i].id, { status: "lost" });
            }

            await sendWinnerEmail(
              winningBid.created_by,
              listingData,
              listingData.current_price
            );

            await sendAdminNotification(
              listingData,
              listingData.current_price,
              winningBid.created_by
            );
          }
          
          loadListing(id);
        } catch (bidsError) {
          console.error("Error processing bids:", bidsError);
        }
      }
    } catch (error) {
      console.error("Error checking auction status:", error);
    }
  };

  const getMinimumBid = () => {
    if (!listing) return 0;
    const currentPrice = listing.current_price || listing.starting_price;
    const increment = listing.bid_increment || 1;
    return (currentPrice + increment).toFixed(2);
  };

  const handleBuyNow = async () => {
    setError(null);
    try {
      const currentUser = await User.me();
      if (!currentUser) {
        setError("Please sign in to purchase");
        return;
      }
      
      const bid = await Bid.create({
        listing_id: listing.id,
        amount: listing.buy_now_price,
        status: "won"
      });

      await Listing.update(listing.id, {
        ...listing,
        current_price: listing.buy_now_price,
        status: "sold"
      });

      await sendWinnerEmail(
        currentUser.email,
        listing,
        listing.buy_now_price
      );

      await sendAdminNotification(
        listing,
        listing.buy_now_price,
        currentUser.email
      );

      setShowPayment(true);
      loadListing(listing.id);
    } catch (error) {
      console.error("Error processing buy now:", error);
      setError("Error processing purchase. Please try again.");
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const currentUser = await User.me();
      if (!currentUser) {
        setError("Please sign in to place a bid");
        return;
      }

      const amount = parseFloat(bidAmount);
      const minBid = parseFloat(getMinimumBid());

      if (!amount || amount < minBid) {
        setError(`Bid must be at least $${minBid}`);
        return;
      }

      await Bid.create({
        listing_id: listing.id,
        amount: amount,
        is_auto_bid: false,
        status: "active",
        created_by: currentUser.email
      });

      await Listing.update(listing.id, { 
        current_price: amount 
      });

      setBidAmount("");
      loadListing(listing.id);
    } catch (error) {
      console.error("Error placing bid:", error);
      setError("Error placing bid. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!listing) {
    return <div className="text-center py-12">Listing not found</div>;
  }

  const isEnded = listing.status === "ended" || listing.status === "sold" || new Date(listing.end_date) < new Date();
  const currentUserBid = user ? bids.find(bid => bid.created_by === user.email) : null;
  const minBid = getMinimumBid();

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
          {listing.images?.[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{listing.title}</h1>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {isEnded ? "Ended" : format(new Date(listing.end_date), "MMM d, h:mma")}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Tag className="w-4 h-4" />
            {listing.category}
          </Badge>
          <Badge variant="secondary">
            Condition: {listing.condition?.replace("_", " ")}
          </Badge>
        </div>

        <Card className="p-4 mb-6">
          <h2 className="font-semibold mb-2">Description</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
        </Card>

        {(listing.status === "ended" || listing.status === "sold") && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {listing.status === "sold" ? (
                "This item has been sold via Buy Now"
              ) : (
                "This auction has ended"
              )}
              {bids.length > 0 && (
                <> - Winning bid: ${bids[0].amount.toFixed(2)}</>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div>
        <Card className="p-6 mb-6">
          <div className="mb-4">
            <div className="text-sm text-gray-500">
              {isEnded ? "Final Price" : "Current Price"}
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ${(listing.current_price || listing.starting_price).toFixed(2)}
            </div>
            {!isEnded && listing.buy_now_price && (
              <div className="mt-2">
                <div className="text-sm text-gray-500">Buy Now Price</div>
                <div className="text-xl font-semibold text-[#F4812C]">
                  ${listing.buy_now_price.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {!isEnded && user?.email !== listing.created_by ? (
            <div className="space-y-4">
              {listing.buy_now_price && (
                <Button 
                  onClick={handleBuyNow} 
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-100 px-4 py-2 h-10 whitespace-nowrap flex items-center justify-center gap-2"
                >
                  Buy Now for ${listing.buy_now_price.toFixed(2)}
                </Button>
              )}
              
              <form onSubmit={handleBid} className="space-y-4">
                <div>
                  <div className="flex justify-between">
                    <Label>Bid Amount</Label>
                    <span className="text-sm text-gray-500">
                      Min bid: ${getMinimumBid()} (${listing.bid_increment} increment)
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Enter bid amount (min $${getMinimumBid()})`}
                    min={getMinimumBid()}
                    step={listing.bid_increment}
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-100 px-4 py-2 h-10 whitespace-nowrap flex items-center justify-center gap-2"
                >
                  Place Bid
                </Button>
              </form>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              {user?.email === listing.created_by ? (
                "You cannot bid on your own listing"
              ) : (
                "This auction has ended"
              )}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">
            {isEnded ? "Final Bid History" : "Bid History"}
          </h2>
          {bids.length > 0 ? (
            <div className="space-y-3">
              {bids.map((bid) => (
                <div key={bid.id} className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="font-medium">${bid.amount.toFixed(2)}</span>
                    <span className="text-gray-500 ml-2">
                      by {bid.created_by.split("@")[0]}
                    </span>
                    {isEnded && bid.status === "won" && (
                      <Badge className="ml-2 bg-green-100 text-green-800">
                        Winner
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(bid.created_date), "MMM d, h:mma")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              No bids yet
            </div>
          )}
        </Card>
      </div>

      {showPayment && user?.email === (bids.find(b => b.status === "won")?.created_by) && (
        <PaymentForm
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          listing={listing}
          bid={bids.find(b => b.status === "won")}
          seller={{ email: listing.created_by }}
        />
      )}
    </div>
  );
}
