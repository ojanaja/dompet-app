This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Push Notifications Setup

Dompet supports push notifications for debt reminders and budget alerts. Here's how to set it up:

### 1. Generate VAPID Keys

If you don't have VAPID keys yet, generate them using:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

This will output:
- Public Key (for `NEXT_PUBLIC_VAPID_PUBLIC_KEY`)
- Private Key (for `VAPID_PRIVATE_KEY`)

### 2. Update Environment Variables

Add these to your `.env` file:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your_public_key_here"
VAPID_PRIVATE_KEY="your_private_key_here"
VAPID_EMAIL="mailto:your-email@example.com"
CRON_SECRET="your_cron_secret_here"
```

### 3. Service Worker

The service worker is automatically registered by Next.js PWA plugin. It's located at `public/sw-push.js`.

### 4. Enable Notifications

1. Go to Settings page in the app
2. Click "Enable" in the Notifications section
3. Allow notifications in your browser

### 5. Testing Notifications

#### Manual Test:
```bash
curl -X POST http://localhost:3000/api/debug/send-test-notification \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello from Dompet!"}'
```

#### Debt Reminders Cron:
To test debt reminders cron job:
```bash
curl -X POST http://localhost:3000/api/cron/debt-reminders \
  -H "Authorization: Bearer your_cron_secret_here"
```

### 6. Production Deployment

For production, set up a cron job to send daily reminders:

#### Vercel Cron:
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/debt-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

#### GitHub Actions:
Create `.github/workflows/debt-reminders.yml`:
```yaml
name: Debt Reminders
on:
  schedule:
    - cron: '0 9 * * *'
jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send Debt Reminders
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/debt-reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Browser Support

Push notifications work in:
- Chrome 42+
- Firefox 44+
- Edge 17+
- Safari 16.4+ (with limitations)

### Troubleshooting

1. **Notifications not showing**: Check browser permissions and ensure VAPID keys are correct
2. **Service worker not registering**: Ensure PWA is enabled in `next.config.ts`
3. **Subscription errors**: Check browser console for errors and verify VAPID keys format

### Security Notes

- Keep `VAPID_PRIVATE_KEY` and `CRON_SECRET` secure
- Use HTTPS in production (required for push notifications)
- Regularly rotate cron secrets in production

## Backup & Maintenance

For production deployments, especially when using Docker volumes for PostgreSQL, it is critical to implement a backup strategy to prevent data loss.

### PostgreSQL Volume Backup

If running PostgreSQL via Docker, back up your database volume regularly:

```bash
# Example script to dump the database inside the container
docker exec dompet_postgres pg_dump -U dompet_user dompet_db > /path/to/backup/dompet_backup_$(date +%Y%m%d).sql
```

You can set up a cron job on your host server to execute this script daily.

### CI/CD Setup

To ensure seamless deployments without downtime, it's recommended to set up CI/CD pipelines (e.g., using GitHub Actions or GitLab CI).

1. **Automated Builds**: Configure your pipeline to run `npm run build` to catch any compilation errors before deploying.
2. **Docker Watchtower**: If deploying via Docker, tools like [Watchtower](https://containrrr.dev/watchtower/) can automatically pull and restart containers when a new image is pushed to your container registry.
3. **Database Migrations**: Ensure `npx prisma migrate deploy` runs as part of the deployment script before starting the new application container.