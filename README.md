# Ocean Sumria Rewards System

## Backend Setup (Supabase)

1. **Create a Supabase Project**: Go to [database.new](https://database.new) and create a new project.
2. **Apply Migration**: 
   - Copy the content of `supabase/migrations/20240101000000_init_schema.sql`.
   - Go to your Supabase Dashboard -> SQL Editor -> New Query.
   - Paste the SQL and run it.
3. **Environment Variables**:
   - Rename `.env.example` to `.env.local`.
   - Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings > API.

## Design Decisions
- **RLS**: Policies ensure customers can't edit their own points/spins. All critical logic is server-side (RPC).
- **IDs**: `public_id` (OS-XXXX) and `coupon.code` are auto-generated DB-side to prevent collisions.
