This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Setup

You will need the `OPENAI_API_KEY` environment variable. Put it in .env file.
```bash
OPENAI_API_KEY=[myApiKey]
```

## Run
I added a dependency so you may have to update that with
```bash
npm install
```

Then, you can run the development server:

```bash
npm run dev --registry https://registry.npmjs.org
```
I added the --registry flag due to some npm issues I was facing, this usually isn't necessary.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
