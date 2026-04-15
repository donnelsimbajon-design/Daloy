import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ShieldAlert, ArrowLeft, Send } from 'lucide-react';

export default function BannedAppeal() {
    const { data, setData, post, processing, errors, reset } = useForm({
        reason: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/banned/appeal', {
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <Head title="Submit Appeal | Daloy" />
            
            {/* Background Aesthetic */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-red-600 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-zinc-800 rounded-full blur-[150px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                    
                    {/* Top Strip */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>

                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-4 mb-6 mt-2">
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Submit an Appeal</h1>
                            <p className="text-zinc-400 mt-2 text-sm max-w-sm mx-auto">
                                If you believe your account was suspended by mistake or you have rectified the behavior, please explain below.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label htmlFor="reason" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Appeal details</label>
                            <textarea
                                id="reason"
                                name="reason"
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                                rows="5"
                                placeholder="Please explain why your suspension should be lifted..."
                                required
                            />
                            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Link 
                                href="/banned"
                                className="w-full py-3 px-4 bg-transparent hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Cancel
                            </Link>
                            
                            <button 
                                type="submit"
                                disabled={processing}
                                className={`w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {processing ? 'Submitting...' : 'Submit Appeal'}
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>

                </div>

                <div className="text-center mt-6">
                    <p className="text-zinc-600 text-xs font-mono">
                        Daloy Automated Moderation System
                    </p>
                </div>
            </div>
        </div>
    );
}
