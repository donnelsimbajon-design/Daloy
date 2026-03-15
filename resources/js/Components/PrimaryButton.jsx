export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            className={
                `w-full inline-flex items-center justify-center px-6 py-3 bg-biolum border border-transparent rounded-xl font-semibold text-sm text-white tracking-wide hover:bg-biolum-bright active:from-biolum-dim focus:outline-none focus:ring-2 focus:ring-biolum/50 focus:ring-offset-2 focus:ring-offset-ocean-deep transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
