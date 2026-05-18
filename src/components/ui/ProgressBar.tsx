interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  animated?: boolean;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const variantStyles = {
  primary: 'bg-primary',
  success: 'bg-secondary',
  warning: 'bg-accent',
  danger: 'bg-danger',
};

export function ProgressBar({ value, max = 100, size = 'md', variant = 'primary', showLabel = false, animated = true }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      <div className={`w-full bg-border rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`h-full ${variantStyles[variant]} rounded-full transition-all duration-500 ease-out ${
            animated ? '' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-text-muted">
          <span>{value}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}