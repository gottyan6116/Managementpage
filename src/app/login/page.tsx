import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="app-background flex min-h-screen items-center justify-center px-4">
      <div className="glass-card w-full max-w-sm rounded-2xl p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-600">
            <span className="text-lg font-extrabold text-white">P</span>
          </span>
          <h1 className="mt-3 text-lg font-bold text-ink">ProManage</h1>
          <p className="mt-1 text-xs text-ink-soft">続けるにはパスワードを入力してください</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
