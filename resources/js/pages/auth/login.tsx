import LogoMA from '@/assets/images/malogo.png';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Toaster } from '@/components/ui/sonner';
import { store } from '@/routes/login';
import { Form, usePage } from '@inertiajs/react';
import { LogIn } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Login() {
    const { flash } = usePage().props as unknown as { flash?: { error?: string; success?: string } };

    useEffect(() => {
        if (flash?.error) toast.error(flash.error);
        if (flash?.success) toast.success(flash.success);
    }, [flash]);

    return (
        <>
            <div className="flex min-h-screen">
                {/* Left Side - Login Form */}
                <div className="flex flex-1 items-center justify-center bg-white p-8">
                    <div className="w-full max-w-md space-y-8">
                        {/* Logo & Title */}
                        <div className="space-y-4 text-center">
                            <div className="flex justify-center">
                                <div className="rounded-2xl bg-white p-4 shadow-lg">
                                    <img
                                        src={LogoMA}
                                        alt="Honda Logo"
                                        className="h-16 w-16"
                                    />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    PT. Menara Agung
                                </h1>
                                <p className="mt-2 text-gray-600">
                                    Main Dealer Honda Sumatera Barat
                                </p>
                            </div>
                        </div>

                        {status && (
                            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-700">
                                {status}
                            </div>
                        )}

                        {/* Login Form */}
                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="email"
                                                className="font-medium text-gray-700"
                                            >
                                                Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="nama@menara-agung.com"
                                                className="h-12 text-base"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="password"
                                                className="font-medium text-gray-700"
                                            >
                                                Password
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                className="h-12 text-base"
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                            />
                                            <Label
                                                htmlFor="remember"
                                                className="cursor-pointer text-sm text-gray-600"
                                            >
                                                Ingat saya
                                            </Label>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="h-12 w-full bg-primary text-base font-semibold hover:bg-primary/90"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing ? (
                                            <>
                                                <Spinner className="mr-2" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="mr-2 h-5 w-5" />
                                                Masuk
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                        </Form>

                        {/* Footer */}
                        <div className="text-center text-sm text-gray-500">
                            <p>© 2026 Honda. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </>
    );
}
