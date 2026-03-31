export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface)] px-4 py-12">
      <div className="w-full max-w-sm rounded-xl bg-[var(--surface-low)] px-6 py-8">
        {children}
      </div>
    </div>
  );
}
