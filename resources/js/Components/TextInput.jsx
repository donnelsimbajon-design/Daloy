import { forwardRef, useRef } from 'react';

const TextInput = forwardRef(({ type = 'text', className = '', isFocused = false, ...props }, ref) => {
    const inputRef = ref || useRef();

    return (
        <input
            {...props}
            type={type}
            className={
                'w-full px-4 py-3 bg-ocean-surface/60 border border-ocean-border rounded-xl text-ocean-text placeholder-ocean-text-dim text-sm focus:outline-none focus:ring-2 focus:ring-biolum/40 focus:border-biolum/50 transition-all duration-200 backdrop-blur-sm ' +
                className
            }
            ref={inputRef}
            autoFocus={isFocused}
        />
    );
});

TextInput.displayName = 'TextInput';

export default TextInput;
