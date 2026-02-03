# Quotation Backend (Express + MySQL)

## Setup
1. Copy `.env.example` to `.env` and fill in DB credentials and `JWT_SECRET`.
2. If you're using an existing database (`quotation_system`), run:
   ```sql
   SOURCE migrations/001_add_job_fields.sql;
   SOURCE migrations/002_create_orders.sql;
   ```
   Otherwise create the schema:
   ```sql
   SOURCE schema.sql;
   ```
3. Create an admin user (hash a password):
   ```bash
   node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('admin123',10));"
   ```
   Then insert into MySQL:
   ```sql
   INSERT INTO users (name,email,password,role)
   VALUES ('Admin','admin@example.com','<hash>','admin');
   ```

## Run
```bash
npm install
npm run dev
```

## API
- POST `/api/auth/login`
- POST `/api/orders` (auth required)
- GET `/api/orders` (admin only)
