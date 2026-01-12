# Frontend API Contract

## RPC Functions Available

All RPCs are called via `supabase.rpc('function_name', { params })`.

---

### 1. `rpc_get_my_profile()`
**Purpose**: Get current logged-in user's profile  
**Caller**: Any authenticated user  
**Parameters**: None  

**Returns on Success**:
```json
{
  "id": "uuid",
  "public_id": "OS-XXXX",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "customer",
  "points": 150,
  "spins": 3
}
```

**Returns on Error**:
```json
{ "error": "PROFILE_NOT_FOUND", "message": "Profile not found" }
```

---

### 2. `rpc_staff_find_user_by_public_id(p_public_id: string)`
**Purpose**: Staff scans customer QR code to look up profile  
**Caller**: Staff, Manager, or Admin only  
**Parameters**: 
- `p_public_id`: The customer's public ID (e.g., "OS-6544")

**Returns on Success**:
```json
{
  "found": true,
  "profile": {
    "id": "uuid",
    "public_id": "OS-6544",
    "name": "Customer Name",
    "email": "customer@email.com",
    "points": 100,
    "spins": 2
  }
}
```

**Returns on Not Found**:
```json
{ "found": false, "message": "Customer not found" }
```

**Returns on Unauthorized**:
```json
{ "error": "UNAUTHORIZED", "message": "Staff access required" }
```

---

### 3. `rpc_staff_add_points(p_public_id: string, p_usd_cents: number, p_note?: string)`
**Purpose**: Staff adds points to customer (1 point per $1)  
**Caller**: Staff, Manager, or Admin only  
**Parameters**:
- `p_public_id`: Customer's public ID
- `p_usd_cents`: Bill amount in cents (e.g., 5000 = $50)
- `p_note`: Optional note/receipt reference

**Returns on Success**:
```json
{
  "status": "success",
  "points_added": 50,
  "new_points": 150,
  "new_spins": 2
}
```

**Error Codes**:
- `UNAUTHORIZED`: Caller is not staff/manager/admin
- `INVALID_AMOUNT`: Amount less than $1
- `USER_NOT_FOUND`: No customer with that public_id

---

### 4. `rpc_staff_add_spins(p_public_id: string, p_spins: number, p_note?: string)`
**Purpose**: Staff grants free spins to customer  
**Caller**: Staff, Manager, or Admin only  
**Parameters**:
- `p_public_id`: Customer's public ID
- `p_spins`: Number of spins to add
- `p_note`: Optional note

**Returns on Success**:
```json
{
  "status": "success",
  "spins_added": 3,
  "new_points": 100,
  "new_spins": 5
}
```

**Error Codes**: Same as `rpc_staff_add_points`

---

### 5. `rpc_spin()`
**Purpose**: Customer spins the prize wheel  
**Caller**: Any authenticated user with spins > 0  
**Parameters**: None

**Returns on Win**:
```json
{
  "ok": true,
  "outcome": "WIN",
  "prize": {
    "name": "10% Off",
    "type": "discount",
    "value": "10% Off",
    "icon": "local_offer"
  },
  "coupon_code": "WIN-A3B4C5D6",
  "spins": 2,
  "points": 100
}
```

**Returns on No Win**:
```json
{
  "ok": true,
  "outcome": "NO_WIN",
  "message": "Better luck next time!",
  "spins": 2,
  "points": 100
}
```

**Error Codes**:
- `USER_NOT_FOUND`: Profile not found
- `NO_SPINS`: User has 0 spins
- `NO_POOL`: No published prize pool

---

### 6. `rpc_staff_redeem_coupon(p_code: string)`
**Purpose**: Staff redeems a customer's coupon  
**Caller**: Staff, Manager, or Admin only  
**Parameters**:
- `p_code`: The coupon code (e.g., "WIN-A3B4C5D6")

**Returns on Success**:
```json
{
  "success": true,
  "prize_name": "10% Off",
  "customer_id": "uuid"
}
```

**Error Codes**:
- `UNAUTHORIZED`: Not staff
- `NOT_FOUND`: Coupon doesn't exist
- `ALREADY_REDEEMED`: Coupon already used
- `EXPIRED`: Coupon has expired

---

### 7. `rpc_convert_points_to_spins(p_spin_count: number)`
**Purpose**: Customer converts points to spins (100 pts = 1 spin)  
**Caller**: Any authenticated user  
**Parameters**:
- `p_spin_count`: Number of spins to purchase

**Returns on Success**:
```json
{
  "success": true,
  "spins_added": 2,
  "points_spent": 200,
  "new_points": 50,
  "new_spins": 4
}
```

**Error Codes**:
- `INVALID_AMOUNT`: spin_count <= 0
- `USER_NOT_FOUND`: Profile not found
- `INSUFFICIENT_POINTS`: Not enough points

---

## Frontend Usage Examples

```typescript
// Get my profile
const { data, error } = await supabase.rpc('rpc_get_my_profile');

// Staff: Find customer
const { data, error } = await supabase.rpc('rpc_staff_find_user_by_public_id', {
  p_public_id: 'OS-6544'
});

// Staff: Add points ($50 bill)
const { data, error } = await supabase.rpc('rpc_staff_add_points', {
  p_public_id: 'OS-6544',
  p_usd_cents: 5000,
  p_note: 'Receipt #12345'
});

// Customer: Spin wheel
const { data, error } = await supabase.rpc('rpc_spin');

// Staff: Redeem coupon
const { data, error } = await supabase.rpc('rpc_staff_redeem_coupon', {
  p_code: 'WIN-A3B4C5D6'
});

// Customer: Convert 200 points to 2 spins
const { data, error } = await supabase.rpc('rpc_convert_points_to_spins', {
  p_spin_count: 2
});
```

---

## Database Guarantees

1. **Profile Auto-Creation**: When a user signs up via Supabase Auth, a profile is automatically created with:
   - Unique `public_id` (OS-XXXX format)
   - Default role: `customer`
   - Points: 0, Spins: 0

2. **Concurrency Safety**: All balance-modifying operations use row-level locks (`FOR UPDATE`) to prevent race conditions.

3. **Audit Trail**: Every points/spins change is logged in the `ledger` table with actor, timestamp, and metadata.

4. **Prize Limits**: Prizes can have `total_available` and `win_limit_per_user` limits enforced at spin time.

---

## Frontend Recommendations

1. **Profile Fetching**: Use `rpc_get_my_profile()` instead of direct table queries for reliability.

2. **Retry Logic**: If profile fetch returns `PROFILE_NOT_FOUND` immediately after signup, retry with exponential backoff (trigger may be processing).

3. **Timeout Handling**: Set reasonable timeouts (10-15s) for RPC calls, not aggressive 3s timeouts.

4. **Role Normalization**: Always compare roles as lowercase strings (database stores `customer`, not `CUSTOMER`).

5. **Error Handling**: Check for `error` or `status: 'error'` in RPC responses before assuming success.
