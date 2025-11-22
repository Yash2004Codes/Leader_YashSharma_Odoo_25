# 🚀 Quick Start - StockMaster with Supabase

## ✅ You've Completed:
- [x] Created Supabase project
- [x] Ran `supabase-schema.sql` - Schema created!

## 📝 Next Steps (2 minutes):

### 1. Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **API**
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

### 2. Create `.env.local` File
Create a file named `.env.local` in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=change-this-to-a-random-secret-key-min-32-characters
JWT_EXPIRES_IN=7d
```

**Replace** `your-project-id` and `your-anon-key-here` with your actual values from Step 1.

### 3. Start the App
```bash
npm run dev
```

### 4. Test It!
1. Open http://localhost:3000
2. Click "Sign up" and create a test user
3. Go back to Supabase dashboard → **Table Editor** → `users` table
4. You should see your new user! 🎉

## 🎯 Verify Schema Was Created
In Supabase dashboard, go to **Table Editor** and you should see these tables:
- ✅ users
- ✅ warehouses
- ✅ products
- ✅ product_categories
- ✅ stock_levels
- ✅ receipts, receipt_items
- ✅ delivery_orders, delivery_order_items
- ✅ internal_transfers, transfer_items
- ✅ stock_adjustments, adjustment_items
- ✅ stock_ledger
- ✅ otp_codes

## 🆘 Troubleshooting

**"Invalid API key" or connection errors**
- Double-check `.env.local` has correct Supabase URL and key
- Make sure variable names start with `NEXT_PUBLIC_`
- Restart dev server after creating `.env.local`

**"relation does not exist"**
- Go back to SQL Editor in Supabase
- Run `supabase-schema.sql` again
- Check you're in the correct project

**Build works but app shows errors**
- Check browser console for specific errors
- Verify Supabase project is not paused
- Ensure internet connection is working
