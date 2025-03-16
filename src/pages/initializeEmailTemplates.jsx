import { EmailTemplate } from '@/api/entities';

export async function initializeDefaultTemplates() {
  try {
    const templates = await EmailTemplate.list();
    
    const defaultTemplates = {
      auction_won: {
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
      },
      admin_notification: {
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
}