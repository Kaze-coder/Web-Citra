import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Citra ISP</h1>
      <p className="text-muted-foreground">Sistem Manajemen ISP</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="bg-primary text-primary-foreground rounded-md px-6 py-2 font-medium"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="bg-secondary text-secondary-foreground rounded-md px-6 py-2 font-medium"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
