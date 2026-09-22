import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="text-muted-foreground text-sm">
        Authentication will be wired in Phase 3.
      </p>
      <Link
        href="/dashboard"
        className="bg-primary text-primary-foreground rounded-md px-6 py-2 text-sm font-medium"
      >
        Continue to Dashboard →
      </Link>
    </div>
  );
}
