import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { Swords } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const setPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type LoginFormData = z.infer<typeof loginSchema>
type SetPasswordFormData = z.infer<typeof setPasswordSchema>

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { signIn, signUp, needsPasswordSetup, setPassword } = useAuth()

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const passwordForm = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
  })

  async function onLogin(data: LoginFormData) {
    setError(null)
    setSuccess(null)
    try {
      if (isSignUp) {
        await signUp(data.email, data.password)
        setSuccess('Account created! Check your email to confirm.')
      } else {
        await signIn(data.email, data.password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  async function onSetPassword(data: SetPasswordFormData) {
    setError(null)
    try {
      await setPassword(data.password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="min-h-screen bg-parchment-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Swords className="text-gold-400 mx-auto mb-3" size={48} />
          <h1 className="font-display text-4xl text-ink-900 tracking-wider">Squire</h1>
          <p className="text-ink-500 mt-1 font-body">Every Hero Needs a Squire</p>
        </div>

        {/* Form Card */}
        <div className="bg-parchment-100 border border-parchment-400 rounded-lg p-8 shadow-[var(--shadow-lg)] relative">
          <div className="absolute inset-0 rounded-lg shadow-[var(--shadow-inner-parchment)] pointer-events-none" />
          <div className="relative">
            {needsPasswordSetup ? (
              <>
                <h2 className="font-display text-xl text-ink-900 text-center mb-2">
                  Welcome, Adventurer!
                </h2>
                <p className="text-ink-500 text-sm text-center mb-6 font-body">
                  Set a password to secure your account.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={passwordForm.handleSubmit(onSetPassword)} className="space-y-4">
                  <Input
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="Choose a passphrase"
                    error={passwordForm.formState.errors.password?.message}
                    {...passwordForm.register('password')}
                  />
                  <Input
                    id="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    placeholder="Repeat your passphrase"
                    error={passwordForm.formState.errors.confirmPassword?.message}
                    {...passwordForm.register('confirmPassword')}
                  />
                  <Button type="submit" className="w-full" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? 'Saving...' : 'Set Password & Enter'}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl text-ink-900 text-center mb-6">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </h2>

                {error && (
                  <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-heal/10 border border-heal/30 rounded text-heal text-sm">
                    {success}
                  </div>
                )}

                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <Input
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="adventurer@realm.com"
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register('email')}
                  />
                  <Input
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="Your secret passphrase"
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register('password')}
                  />
                  <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? 'Loading...' : isSignUp ? 'Create Account' : 'Enter'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null) }}
                    className="text-sm text-gold-600 hover:text-gold-500 font-body cursor-pointer"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
