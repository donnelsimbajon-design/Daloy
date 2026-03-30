<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminAuthController extends Controller
{
    private const ACCESS_CODE = 'WEBSYSTEMPROJECT001';

    /**
     * Show admin login page. Returns 404 if already authenticated as non-admin.
     */
    public function create()
    {
        // If logged in as admin already, redirect to dashboard
        if (Auth::check() && Auth::user()->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Admin/Login');
    }

    /**
     * Handle admin login with email, password, and access code.
     */
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'access_code' => 'required|string',
        ]);

        // 1. Validate access code
        if ($request->access_code !== self::ACCESS_CODE) {
            return back()->withErrors([
                'access_code' => 'Invalid access code.',
            ]);
        }

        // 2. Attempt authentication
        if (!Auth::attempt(['email' => $request->email, 'password' => $request->password], $request->boolean('remember'))) {
            return back()->withErrors([
                'email' => 'Invalid credentials.',
            ]);
        }

        $user = Auth::user();

        // 3. Check if user is admin
        if (!$user->isAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return back()->withErrors([
                'email' => 'Unauthorized access.',
            ]);
        }

        // 4. Check if user is verified
        if (!$user->hasVerifiedEmail()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return back()->withErrors([
                'email' => 'Account not verified.',
            ]);
        }

        $request->session()->regenerate();

        // Log admin login
        \App\Models\AdminLog::create([
            'admin_id' => $user->admin->id,
            'action' => 'Admin Login',
            'ip_address' => $request->ip(),
            'metadata' => ['user_agent' => $request->userAgent()],
        ]);

        return redirect()->route('admin.dashboard');
    }

    /**
     * Log admin out.
     */
    public function destroy(Request $request)
    {
        $user = Auth::user();

        if ($user && $user->isAdmin()) {
            \App\Models\AdminLog::create([
                'admin_id' => $user->admin->id,
                'action' => 'Admin Logout',
                'ip_address' => $request->ip(),
            ]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}
