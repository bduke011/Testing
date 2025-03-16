
import React, { useState, useEffect } from "react";
import { EmailTemplate, User } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mail, AlertCircle, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TEMPLATE_TYPES = {
  auction_won: {
    label: "Auction Won",
    variables: ["{{item_title}}", "{{final_price}}", "{{payment_instructions}}", "{{winner_name}}", "{{transaction_details}}"]
  },
  admin_notification: {
    label: "Admin Notification",
    variables: ["{{item_title}}", "{{final_price}}", "{{auction_details}}"]
  }
};

export default function EmailTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState({});
  const [activeType, setActiveType] = useState("auction_won");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkAdmin();
    initializeTemplates();
  }, []);

  const checkAdmin = async () => {
    const userData = await User.me();
    if (userData?.role !== "admin") {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const getDefaultTemplate = (type) => {
    switch (type) {
      case "auction_won":
        return {
          template_type: "auction_won",
          from_email: "no-reply@trubid.auction",
          subject: "Congratulations! You've won the auction for {{item_title}}",
          body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { max-width: 150px; }
    h1 { color: #1B2841; }
    .highlight { color: #F4812C; font-weight: bold; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Congratulations, {{winner_name}}!</h1>
    </div>
    
    <p>You've successfully won the auction for <span class="highlight">{{item_title}}</span> with a final bid of <span class="highlight">${{final_price}}</span>.</p>
    
    {{transaction_details}}
    
    <h2>Payment Instructions</h2>
    <p>Please complete your payment promptly to finalize your purchase:</p>
    
    {{payment_instructions}}
    
    <p>If you have any questions about payment or your purchase, please contact the seller directly.</p>
    
    <div class="footer">
      <p>Thank you for using TruBid!</p>
      <p>&copy; ${new Date().getFullYear()} TruBid. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
        };
      case "admin_notification":
        return {
          template_type: "admin_notification",
          from_email: "no-reply@trubid.auction",
          subject: "Auction Completed: {{item_title}}",
          body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1B2841; }
    .highlight { color: #F4812C; font-weight: bold; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Auction Complete</h1>
    
    <p>An auction has been completed on TruBid.</p>
    
    {{auction_details}}
    
    <p>The buyer has been notified with payment instructions. You should expect payment soon.</p>
    
    <p>This is an automated notification. No action is required from you at this time.</p>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} TruBid. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
        };
      default:
        return null;
    }
  };

  const initializeTemplates = async () => {
    try {
      const templates = await EmailTemplate.list();
      const defaultTemplates = ['auction_won', 'admin_notification'];

      for (const type of defaultTemplates) {
        const exists = templates.some(t => t.template_type === type);
        if (!exists) {
          const defaultTemplate = getDefaultTemplate(type);
          if (defaultTemplate) {
            await EmailTemplate.create(defaultTemplate);
          }
        }
      }

      loadTemplates();
    } catch (error) {
      console.error("Error initializing templates:", error);
    }
  };

  const loadTemplates = async () => {
    try {
      const allTemplates = await EmailTemplate.list();
      const templatesMap = allTemplates.reduce((acc, template) => {
        acc[template.template_type] = template;
        return acc;
      }, {});

      Object.keys(TEMPLATE_TYPES).forEach(type => {
        if (!templatesMap[type]) {
          templatesMap[type] = {
            template_type: type,
            from_email: "no-reply@trubid.auction",
            subject: getDefaultTemplate(type).subject,
            body: getDefaultTemplate(type).body,
            is_active: true
          };
        }
      });

      setTemplates(templatesMap);
    } catch (error) {
      console.error("Error loading email templates:", error);
      setError("Error loading templates");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const template = templates[activeType];
      if (template.id) {
        await EmailTemplate.update(template.id, template);
      } else {
        await EmailTemplate.create(template);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving template:", error);
      setError("Error saving template");
    }
    setSaving(false);
  };

  const handleChange = (field, value) => {
    setTemplates(prev => ({
      ...prev,
      [activeType]: {
        ...prev[activeType],
        [field]: value
      }
    }));
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2841]">Email Templates</h1>
          <p className="text-gray-500">Customize notification emails sent to users</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Edit Templates</CardTitle>
        </CardHeader>
        <div className="p-6">
          <Tabs value={activeType} onValueChange={setActiveType}>
            <TabsList className="mb-6">
              {Object.entries(TEMPLATE_TYPES).map(([type, { label }]) => (
                <TabsTrigger key={type} value={type}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>From Email</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Email address that users will see as the sender</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  value={templates[activeType]?.from_email || ""}
                  onChange={(e) => handleChange("from_email", e.target.value)}
                  placeholder="no-reply@trubid.auction"
                />
              </div>

              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={templates[activeType]?.subject || ""}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Email Body</Label>
                  <div className="text-sm text-gray-500">
                    Available variables:
                    {TEMPLATE_TYPES[activeType].variables.map(variable => (
                      <code key={variable} className="mx-1 px-1 bg-gray-100 rounded">
                        {variable}
                      </code>
                    ))}
                  </div>
                </div>
                <textarea
                  value={templates[activeType]?.body || ""}
                  onChange={(e) => handleChange("body", e.target.value)}
                  placeholder="Enter email content"
                  className="min-h-[200px] w-full p-3 rounded-md border border-input bg-background"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Template saved successfully!</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
