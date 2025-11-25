interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function Toggle({ isOn, onToggle, disabled = false }: ToggleProps) {
  return (
    <div className="toggle-container">
      <div className={`toggle-box ${isOn ? 'toggle-box-on' : 'toggle-box-off'}`}>
        <label 
          className={`toggle-switch ${isOn ? 'toggle-switch-on' : 'toggle-switch-off'}`}
          onClick={disabled ? undefined : onToggle}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <div className={`toggle-yoke ${isOn ? 'toggle-yoke-on' : 'toggle-yoke-off'}`}></div>
        </label>
      </div>
    </div>
  );
}
