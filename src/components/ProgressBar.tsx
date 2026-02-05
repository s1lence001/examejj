interface ProgressBarProps {
    value: number;
    max: number;
    showLabel?: boolean;
    size?: 'small' | 'medium';
}

export function ProgressBar({ value, max, showLabel = true, size = 'medium' }: ProgressBarProps) {
    const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

    return (
        <div className={`progress-bar-container ${size}`}>
            <div className="progress-bar">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <span className="progress-bar-label">{value}/{max}</span>
            )}
        </div>
    );
}
