import React, { useState, useEffect } from "react";
import { PaymentSettings, User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save, Upload, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PaymentSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    paypal_email: "",
    cashapp_id: "",
    cashapp_qr: "",
    venmo_id: "",
    venmo_qr: "",
    bank_name: "",
    bank_account_name: "",
    bank_account_number: "",
    bank_routing_number: "",
    payment_instructions: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkAdmin();
    loadSettings();
  }, []);

  const checkAdmin = async () => {
    const userData = await User.me();
    if (userData?.role !== "admin") {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const loadSettings = async () => {
    try {
      const allSettings = await PaymentSettings.list();
      if (allSettings.length > 0) {
        setSettings(allSettings[0]);
      }
    } catch (error) {
      console.error("Error loading payment settings:", error);
    }
    setLoading(false);
  };

  const handleQRUpload = async (type, file) => {
    try {
      const { file_url } = await UploadFile({ file });
      setSettings(prev => ({
        ...prev,
        [`${type}_qr`]: file_url
      }));
    } catch (error) {
      setError("Error uploading QR code. Please try again.");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess(false);

      if (settings.id) {
        await PaymentSettings.update(settings.id, settings);
      } else {
        await PaymentSettings.create(settings);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError("Error saving payment settings. Please try again.");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2841]">Payment Settings</h1>
          <p className="text-gray-500">Configure your payment methods and instructions</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#F4812C]" />
              PayPal Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>PayPal Email</Label>
              <Input
                value={settings.paypal_email}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  paypal_email: e.target.value
                }))}
                placeholder="Enter your PayPal email"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#F4812C]" />
              Cash App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cash App $Cashtag</Label>
              <Input
                value={settings.cashapp_id}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  cashapp_id: e.target.value
                }))}
                placeholder="Enter your $Cashtag (e.g., $username)"
              />
            </div>
            <div>
              <Label>Cash App QR Code</Label>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  {settings.cashapp_qr && (
                    <img
                      src={settings.cashapp_qr}
                      alt="Cash App QR Code"
                      className="max-w-[200px] h-auto mb-2"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQRUpload('cashapp', e.target.files[0])}
                    className="hidden"
                    id="cashapp-qr"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('cashapp-qr').click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload QR Code
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#F4812C]" />
              Venmo Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Venmo Username</Label>
              <Input
                value={settings.venmo_id}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  venmo_id: e.target.value
                }))}
                placeholder="Enter your Venmo username"
              />
            </div>
            <div>
              <Label>Venmo QR Code</Label>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  {settings.venmo_qr && (
                    <img
                      src={settings.venmo_qr}
                      alt="Venmo QR Code"
                      className="max-w-[200px] h-auto mb-2"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleQRUpload('venmo', e.target.files[0])}
                    className="hidden"
                    id="venmo-qr"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('venmo-qr').click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload QR Code
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#F4812C]" />
              Bank Transfer Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bank Name</Label>
              <Input
                value={settings.bank_name}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  bank_name: e.target.value
                }))}
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <Label>Account Holder Name</Label>
              <Input
                value={settings.bank_account_name}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  bank_account_name: e.target.value
                }))}
                placeholder="Enter name on account"
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                value={settings.bank_account_number}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  bank_account_number: e.target.value
                }))}
                placeholder="Enter account number"
                type="password"
              />
            </div>
            <div>
              <Label>Routing Number</Label>
              <Input
                value={settings.bank_routing_number}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  bank_routing_number: e.target.value
                }))}
                placeholder="Enter routing number"
                type="password"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#F4812C]" />
              Additional Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings.payment_instructions}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                payment_instructions: e.target.value
              }))}
              placeholder="Enter any additional payment instructions or notes"
              className="h-32"
            />
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Payment settings saved successfully!</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Payment Settings"}
        </Button>
      </div>
    </div>
  );
}