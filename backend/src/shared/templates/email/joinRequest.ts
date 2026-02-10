export const joinRequestTemplate = (requesterName: string, postTitle: string, viewLink: string): string => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Join Request</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 24px; border-bottom: 1px solid #f3f4f6; padding-bottom: 24px;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">TeamUp</h1>
    </div>
    <h2 style="font-size: 16px; font-weight: 600; color: #374151; margin-top: 0; margin-bottom: 16px;">New Join Request</h2>
    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px;">${requesterName} has requested to join your project:</p>
    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-weight: 600; font-size: 15px; color: #111827;">${postTitle}</p>
    </div>
    <a href="${viewLink}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">View Request</a>
  </div>
</body>
</html>
`;
