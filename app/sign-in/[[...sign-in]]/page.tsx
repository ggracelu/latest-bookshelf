import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-cormorant)] text-3xl text-accent mb-2">Welcome Back</h1>
        <p className="text-warm-gray mb-8 text-sm">Sign in to access the bookshelf</p>
        <SignIn />
      </div>
    </div>
  );
}
