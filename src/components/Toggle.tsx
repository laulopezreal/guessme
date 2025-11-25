interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function Toggle({ isOn, onToggle, disabled = false }: ToggleProps) {
  return (
    <div className="toggle-container">
      <div className={`toggle-box ${isOn ? 'toggle-box-on' : 'toggle-box-off'}`}>
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          className={`toggle-switch ${isOn ? 'toggle-switch-on' : 'toggle-switch-off'}`}
          onClick={onToggle}
          disabled={disabled}
        >
          <span className={`toggle-yoke ${isOn ? 'toggle-yoke-on' : 'toggle-yoke-off'}`}></span>
        </button>
      </div>
    </div>
  );
}
