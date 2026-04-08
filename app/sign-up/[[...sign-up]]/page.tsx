import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl text-accent mb-2">Join the Bookshelf</h1>
        <p className="text-warm-gray mb-8 text-sm">Create an account to start collecting</p>
        <SignUp />
      </div>
    </div>
  );
}
