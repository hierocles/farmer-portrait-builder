import { scenarioManifest } from '../store/portraitStore'
import { usePortraitStore } from '../store/portraitStore'

export function SettingsPanel() {
  const settings = usePortraitStore((s) => s.settings)
  const updateSettings = usePortraitStore((s) => s.updateSettings)
  const toggleAdvancedGroup = usePortraitStore((s) => s.toggleAdvancedGroup)

  return (
    <details className="settings-panel sdv-wood-panel">
      <summary className="settings-panel__summary">Settings</summary>
      <div className="settings-panel__body">
        <section className="settings-section sdv-wood-inset">
          <h4 className="settings-section__title">Portrait options</h4>
          <div className="settings-section__options">
            <label className="settings-option">
              <input
                type="checkbox"
                checked={settings.extendedEmotions}
                onChange={(e) => updateSettings({ extendedEmotions: e.target.checked })}
              />
              <span className="settings-option__text">
                More Player Emotions
                <span className="settings-option__hint">scared, surprised, disgust, awkward</span>
              </span>
            </label>

            <label className="settings-option">
              <input
                type="checkbox"
                checked={settings.indoorVariants}
                onChange={(e) => updateSettings({ indoorVariants: e.target.checked })}
              />
              <span className="settings-option__text">
                Indoor seasonal variants
                <span className="settings-option__hint">_indoors filenames</span>
              </span>
            </label>

            <label className="settings-option">
              <input
                type="checkbox"
                checked={settings.resizeOnExport}
                onChange={(e) => updateSettings({ resizeOnExport: e.target.checked })}
              />
              <span className="settings-option__text">Resize to 64×64 on export</span>
            </label>
          </div>
        </section>

        <section className="settings-section sdv-wood-inset">
          <h4 className="settings-section__title">Advanced scenario groups</h4>
          <div className="settings-advanced-grid">
            {scenarioManifest.advancedGroups.map((group) => (
              <label key={group} className="settings-option settings-option--compact">
                <input
                  type="checkbox"
                  checked={!!settings.enabledAdvancedGroups[group]}
                  onChange={() => toggleAdvancedGroup(group)}
                />
                <span className="settings-option__text">{scenarioManifest.groupLabels[group]}</span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </details>
  )
}
