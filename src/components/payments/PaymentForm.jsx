
import React, { useState, useEffect } from 'react';
import { Payment, PaymentSettings, EmailTemplate } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function PaymentForm({ isOpen, onClose, listing, bid, seller }) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [error, setError] = useState(null);
  const [payment, setPayment] = useState({
    payment_method: "",
    buyer_contact: "",
    notes: ""
  });
  const [success, setSuccess]= useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    setLoading(true);
    try {
      const settings = await PaymentSettings.list();
      setPaymentSettings(settings.length > 0 ? settings[0] : null);
      
      if (settings.length > 0 && listing.payment_methods) {
        const methods = listing.payment_methods;
        const settings = settings[0];
        
        if (methods.paypal && settings.paypal_email) {
          setPaymentMethod("paypal");
        } else if (methods.cashapp && settings.cashapp_id) {
          setPaymentMethod("cashapp");
        } else if (methods.venmo && settings.venmo_id) {
          setPaymentMethod("venmo");
        } else if (methods.bank_transfer && settings.bank_name) {
          setPaymentMethod("bank_transfer");
        }
      }
    } catch (error) {
      console.error("Error loading payment settings:", error);
      setError("Unable to load payment information");
    }
    setLoading(false);
  };

  const createEmailBody = () => {
    const invoiceDetails = [
      '<div style="font-family: Arial, sans-serif; color: #333;">',
      '<h2 style="color: #1B2841;">INVOICE DETAILS</h2>',
      '<p><strong>Item:</strong> ' + listing.title + '</p>',
      '<p><strong>Amount:</strong> $' + listing.current_price.toFixed(2) + '</p>',
      '<p><strong>Date:</strong> ' + format(new Date(), "MMMM d, yyyy") + '</p>',
      '<p><strong>Invoice Number:</strong> INV-' + listing.id.slice(-6) + '</p>'
    ].join('');

    const paymentInstructions = ['<h2 style="color: #1B2841;">PAYMENT INSTRUCTIONS</h2>'];

    switch (payment.payment_method) {
      case 'paypal':
        if (paymentSettings?.paypal_email) {
          paymentInstructions.push(
            '<p><strong>PayPal Instructions:</strong></p>',
            '<p>Send payment to: ' + paymentSettings.paypal_email + '</p>'
          );
        }
        break;

      case 'cash_app':
        if (paymentSettings?.cashapp_id) {
          paymentInstructions.push(
            '<p><strong>Cash App Instructions:</strong></p>',
            '<p>Send to: ' + paymentSettings.cashapp_id + '</p>'
          );
          if (paymentSettings.cashapp_qr) {
            paymentInstructions.push(
              '<p>Scan QR Code to pay:</p>',
              '<img src="' + paymentSettings.cashapp_qr + '" alt="Cash App QR Code" style="max-width: 200px" />'
            );
          }
        }
        break;

      case 'venmo':
        if (paymentSettings?.venmo_id) {
          paymentInstructions.push(
            '<p><strong>Venmo Instructions:</strong></p>',
            '<p>Send to: ' + paymentSettings.venmo_id + '</p>'
          );
          if (paymentSettings.venmo_qr) {
            paymentInstructions.push(
              '<p>Scan QR Code to pay:</p>',
              '<img src="' + paymentSettings.venmo_qr + '" alt="Venmo QR Code" style="max-width: 200px" />'
            );
          }
        }
        break;

      case 'bank_transfer':
        if (paymentSettings?.bank_name) {
          paymentInstructions.push(
            '<p><strong>Bank Transfer Instructions:</strong></p>',
            '<p>Bank: ' + paymentSettings.bank_name + '</p>',
            '<p>Account Name: ' + paymentSettings.bank_account_name + '</p>',
            '<p>Account Number: ' + paymentSettings.bank_account_number + '</p>',
            '<p>Routing Number: ' + paymentSettings.bank_routing_number + '</p>'
          );
        }
        break;
    }

    const additionalInfo = [];
    if (paymentSettings?.payment_instructions) {
      additionalInfo.push(
        '<h2 style="color: #1B2841;">ADDITIONAL INSTRUCTIONS</h2>',
        '<p>' + paymentSettings.payment_instructions + '</p>'
      );
    }

    const contactInfo = [
      '<h2 style="color: #1B2841;">CONTACT INFORMATION</h2>',
      '<p>Buyer Contact: ' + payment.buyer_contact + '</p>'
    ];

    if (payment.notes) {
      contactInfo.push('<p>Notes: ' + payment.notes + '</p>');
    }

    return [
      invoiceDetails,
      paymentInstructions.join(''),
      additionalInfo.join(''),
      contactInfo.join(''),
      '</div>'
    ].join('');
  };

  const handleSubmitPayment = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      if (!paymentMethod || !payment.buyer_contact) {
        setError("Please fill out all required fields");
        setIsSubmitting(false);
        return;
      }

      await Payment.create({
        listing_id: listing.id,
        bid_id: bid?.id,
        amount: listing.current_price,
        payment_method: paymentMethod,
        buyer_contact: payment.buyer_contact,
        notes: payment.notes,
        status: "pending"
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error processing payment request:", error);
      setError("Error processing payment request. Please try again.");
    }

    setIsSubmitting(false);
  };

  const getAvailablePaymentMethods = () => {
    const methods = [];
    if (paymentSettings?.paypal_email) {
      methods.push({ value: "paypal", label: "PayPal" });
    }
    if (paymentSettings?.cashapp_id) {
      methods.push({ value: "cash_app", label: "Cash App" });
    }
    if (paymentSettings?.venmo_id) {
      methods.push({ value: "venmo", label: "Venmo" });
    }
    if (paymentSettings?.bank_name) {
      methods.push({ value: "bank_transfer", label: "Bank Transfer" });
    }
    return methods;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
        </DialogHeader>

        {success ? (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payment request submitted! The seller will contact you soon.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmitPayment} className="space-y-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="text-sm text-gray-500">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                <DollarSign className="w-5 h-5" />
                {listing.current_price.toFixed(2)}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preferred Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPayment(prev => ({
                  ...prev,
                  payment_method: value
                }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailablePaymentMethods().map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact Information</Label>
              <Input
                value={payment.buyer_contact}
                onChange={(e) => setPayment(prev => ({
                  ...prev,
                  buyer_contact: e.target.value
                }))}
                placeholder="Email or phone number"
                required
              />
              <p className="text-sm text-gray-500">
                This will be shared with the seller to coordinate payment
              </p>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={payment.notes}
                onChange={(e) => setPayment(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="Any special instructions or questions"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
                className="border-gray-300 hover:bg-gray-100"
              >
                {isSubmitting ? "Processing..." : "Submit Payment Request"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
