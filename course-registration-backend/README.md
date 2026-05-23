1.  npm install

2.   .env
DATABASE_URL="postgresql://postgres.[YOUR-SUPABASE-URL]:[PASSWORD]@[aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres](https://aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres)"
GEMINI_API_KEY="your_google_gemini_api_key_here"

3.   npx prisma format
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts


4.   npm run dev