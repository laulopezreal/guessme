interface CharacterSilhouetteProps {
  revealed: boolean;
  eraTags?: string[];
}

export default function CharacterSilhouette({ revealed, eraTags }: CharacterSilhouetteProps) {
  return (
    <div className="character-container">
      <div className={`character-silhouette ${revealed ? 'revealed' : ''}`}>
        {!revealed && <div className="mystery-icon">?</div>}
      </div>
      {eraTags && eraTags.length > 0 && (
        <div className="era-tags" aria-label="Era tags">
          {eraTags.map(tag => (
            <span className="era-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
