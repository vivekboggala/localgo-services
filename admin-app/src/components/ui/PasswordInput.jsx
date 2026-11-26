import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from './Input';

export const PasswordInput = React.forwardRef(({
  label = 'Password',
  placeholder = 'Enter password',
  showLeftIcon = true,
  ...props
}, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      label={label}
      placeholder={placeholder}
      leftIcon={showLeftIcon ? <Lock className="w-5 h-5" strokeWidth={2} /> : null}
      rightElement={
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="w-10 h-10 rounded-lg inline-flex items-center justify-center text-gray-600 hover:text-brand-ink hover:bg-gray-100 transition-colors duration-150"
        >
          {visible ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
        </button>
      }
      {...props}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
