import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Image
        className="dark:invert"
        src="/next.svg"
        alt="Next.js logo"
        width={180}
        height={38}
        priority
      />
      <p className="mt-8 text-sm text-center">
        Get started by editing <code className="font-mono">src/app/page.tsx</code>
      </p>
    </main>
  );
}