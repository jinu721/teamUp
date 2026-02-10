export const joinResponseTemplate = (postTitle: string, isApproved: boolean, projectLink: string): string => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Request Update</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #111827; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 40px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 24px; border-bottom: 1px solid #f3f4f6; padding-bottom: 24px;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">TeamUp</h1>
    </div>
    <h2 style="font-size: 16px; font-weight: 600; color: #374151; margin-top: 0; margin-bottom: 16px;">Request Update</h2>
    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px;">
      ${isApproved
        ? `Your request to join "${postTitle}" has been approved.`
        : `Your request to join "${postTitle}" was not approved at this time.`
    }
    </p>
    ${isApproved && projectLink ? `
    <div style="margin: 24px 0;">
      <a href="${projectLink}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 500;">Go to Project</a>
    </div>` : ''}
    ${!isApproved ? `
    <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
      Feel free to explore other projects looking for collaborators on the community page.
    </p>` : ''}
  </div>
</body>
</html>
`;
