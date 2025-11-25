interface CharacterSilhouetteProps {
  revealed: boolean;
}

export default function CharacterSilhouette({ revealed }: CharacterSilhouetteProps) {
  return (
    <div className="character-container">
      <div className={`character-silhouette ${revealed ? 'revealed' : ''}`}>
        {!revealed && <div className="mystery-icon">?</div>}
      </div>
    </div>
  );
}
