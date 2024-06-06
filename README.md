# pdf-indexer

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Environment setup

To start developing `pdf-indexer`, you'll need:
- Node.js (only v22.2.0 was tested)
- pnpm (only v9.1.4 was tested)

The project was initialied and developed on a Linux machine (Pop!_OS jammy 22.04 x86_64).  
But since `pdf-indexer` doesn't have any platform-specific dependency, I expect it to be portable and can be deployed to other environment without any (or minimal) changes required.

## Getting Started

First, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

### Next.js
To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

### PDF manipulation:

The project use the following modules to parse & manipulate PDF files:

- [pdf-lib](https://www.npmjs.com/package/pdf-lib) ([Documentation](https://pdf-lib.js.org/))
- [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist) ([Documentation](https://mozilla.github.io/pdf.js/))

## Deploy with Docker:



## Deploy on Vercel

The easiest way to deploy is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
