interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  'aria-label'?: string;
}

export default function Toggle({ isOn, onToggle, disabled = false, 'aria-label': ariaLabel }: ToggleProps) {
  return (
    <div className="toggle-container">
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={ariaLabel}
        className={`toggle-box ${isOn ? 'toggle-box-on' : 'toggle-box-off'}`}
        onClick={onToggle}
        disabled={disabled}
      >
        <span className={`toggle-yoke ${isOn ? 'toggle-yoke-on' : 'toggle-yoke-off'}`}></span>
      </button>
    </div>
  );
}
