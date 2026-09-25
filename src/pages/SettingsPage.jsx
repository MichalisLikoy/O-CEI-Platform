import {
  Bell,
  Camera,
  Database,
  RefreshCw,
  Save,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';

const initialSettings = {
  platformName: 'O-CEI Monitoring System',
  portName: 'Malta Port',
  apiBaseUrl: 'https://agents.sammyacht.com/api/ocei',
  vesselsRefreshSeconds: 60,
  portCallsRefreshSeconds: 60,
  consumptionRefreshSeconds: 300,
  cameraRefreshSeconds: 10,
  energyUnit: 'kWh',
  co2Unit: 't',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  classificationEnabled: true,
  confidenceThreshold: 70,
  showBoundingBoxes: true,
  soundEnabled: false,
  criticalAlerts: true,
  warningAlerts: true,
  infoAlerts: false,
};

function SettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [savedMessage, setSavedMessage] = useState('');

  function updateSetting(name, value) {
    setSettings((current) => ({
      ...current,
      [name]: value,
    }));

    setSavedMessage('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    console.log('Settings saved:', settings);

    setSavedMessage('Settings saved successfully.');

    setTimeout(() => {
      setSavedMessage('');
    }, 3000);
  }

  function handleReset() {
    setSettings(initialSettings);
    setSavedMessage('');
  }

  return (
    <div className="page-content">
      <div className="page-heading settings-page-heading">
        <div>
          <span className="page-eyebrow">Configuration</span>

          
          {/* <h1>Settings</h1> */}

          <p>
            Configure the O-CEI dashboard, API connections and monitoring
            preferences.
          </p>
        </div>
      </div>

      <form className="settings-page-layout" onSubmit={handleSubmit}>
        <div className="settings-main-column">
          <section className="full-page-panel settings-section">
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <Settings2 size={20} />
              </div>

              <div>
                <h2>General settings</h2>
                <p>Basic platform and display configuration.</p>
              </div>
            </div>

            <div className="settings-grid">
              <label className="settings-field">
                <span>Platform name</span>

                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(event) =>
                    updateSetting('platformName', event.target.value)
                  }
                />
              </label>

              <label className="settings-field">
                <span>Port name</span>

                <input
                  type="text"
                  value={settings.portName}
                  onChange={(event) =>
                    updateSetting('portName', event.target.value)
                  }
                />
              </label>

              <label className="settings-field">
                <span>Date format</span>

                <select
                  value={settings.dateFormat}
                  onChange={(event) =>
                    updateSetting('dateFormat', event.target.value)
                  }
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </label>

              <label className="settings-field">
                <span>Time format</span>

                <select
                  value={settings.timeFormat}
                  onChange={(event) =>
                    updateSetting('timeFormat', event.target.value)
                  }
                >
                  <option value="24h">24-hour</option>
                  <option value="12h">12-hour</option>
                </select>
              </label>

              <label className="settings-field">
                <span>Energy unit</span>

                <select
                  value={settings.energyUnit}
                  onChange={(event) =>
                    updateSetting('energyUnit', event.target.value)
                  }
                >
                  <option value="kWh">kWh</option>
                  <option value="MWh">MWh</option>
                </select>
              </label>

              <label className="settings-field">
                <span>CO₂ unit</span>

                <select
                  value={settings.co2Unit}
                  onChange={(event) =>
                    updateSetting('co2Unit', event.target.value)
                  }
                >
                  <option value="kg">kg</option>
                  <option value="t">tonnes</option>
                </select>
              </label>
            </div>
          </section>

          <section className="full-page-panel settings-section">
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <Database size={20} />
              </div>

              <div>
                <h2>API configuration</h2>
                <p>O-CEI backend connection and refresh intervals.</p>
              </div>
            </div>

            <div className="settings-grid">
              <label className="settings-field settings-field-full">
                <span>API base URL</span>

                <input
                  type="url"
                  value={settings.apiBaseUrl}
                  onChange={(event) =>
                    updateSetting('apiBaseUrl', event.target.value)
                  }
                />

                <small>
                  Used by Vessels, Port Calls and Consumption services.
                </small>
              </label>

              <label className="settings-field">
                <span>Vessels refresh</span>

                <div className="settings-input-suffix">
                  <input
                    type="number"
                    min="5"
                    value={settings.vesselsRefreshSeconds}
                    onChange={(event) =>
                      updateSetting(
                        'vesselsRefreshSeconds',
                        Number(event.target.value),
                      )
                    }
                  />

                  <span>seconds</span>
                </div>
              </label>

              <label className="settings-field">
                <span>Port calls refresh</span>

                <div className="settings-input-suffix">
                  <input
                    type="number"
                    min="5"
                    value={settings.portCallsRefreshSeconds}
                    onChange={(event) =>
                      updateSetting(
                        'portCallsRefreshSeconds',
                        Number(event.target.value),
                      )
                    }
                  />

                  <span>seconds</span>
                </div>
              </label>

              <label className="settings-field">
                <span>Consumption refresh</span>

                <div className="settings-input-suffix">
                  <input
                    type="number"
                    min="30"
                    value={settings.consumptionRefreshSeconds}
                    onChange={(event) =>
                      updateSetting(
                        'consumptionRefreshSeconds',
                        Number(event.target.value),
                      )
                    }
                  />

                  <span>seconds</span>
                </div>
              </label>

              <label className="settings-field">
                <span>Camera refresh</span>

                <div className="settings-input-suffix">
                  <input
                    type="number"
                    min="1"
                    value={settings.cameraRefreshSeconds}
                    onChange={(event) =>
                      updateSetting(
                        'cameraRefreshSeconds',
                        Number(event.target.value),
                      )
                    }
                  />

                  <span>seconds</span>
                </div>
              </label>
            </div>
          </section>

          <section className="full-page-panel settings-section">
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <Camera size={20} />
              </div>

              <div>
                <h2>Camera and classification</h2>
                <p>Configure live camera inference and visual detections.</p>
              </div>
            </div>

            <div className="settings-toggle-list">
              <div className="settings-toggle-row">
                <div>
                  <strong>Classification model</strong>
                  <span>Enable vessel classification on the live stream.</span>
                </div>

                <button
                  type="button"
                  className={
                    settings.classificationEnabled
                      ? 'settings-switch settings-switch-active'
                      : 'settings-switch'
                  }
                  onClick={() =>
                    updateSetting(
                      'classificationEnabled',
                      !settings.classificationEnabled,
                    )
                  }
                  aria-pressed={settings.classificationEnabled}
                >
                  <span />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <strong>Bounding boxes</strong>
                  <span>Show detected vessel boxes over the video stream.</span>
                </div>

                <button
                  type="button"
                  className={
                    settings.showBoundingBoxes
                      ? 'settings-switch settings-switch-active'
                      : 'settings-switch'
                  }
                  onClick={() =>
                    updateSetting(
                      'showBoundingBoxes',
                      !settings.showBoundingBoxes,
                    )
                  }
                  aria-pressed={settings.showBoundingBoxes}
                >
                  <span />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <strong>Camera sound</strong>
                  <span>Enable audio playback for supported streams.</span>
                </div>

                <button
                  type="button"
                  className={
                    settings.soundEnabled
                      ? 'settings-switch settings-switch-active'
                      : 'settings-switch'
                  }
                  onClick={() =>
                    updateSetting('soundEnabled', !settings.soundEnabled)
                  }
                  aria-pressed={settings.soundEnabled}
                >
                  <span />
                </button>
              </div>
            </div>

            <div className="settings-range-field">
              <div>
                <span>Confidence threshold</span>
                <strong>{settings.confidenceThreshold}%</strong>
              </div>

              <input
                type="range"
                min="1"
                max="100"
                value={settings.confidenceThreshold}
                onChange={(event) =>
                  updateSetting(
                    'confidenceThreshold',
                    Number(event.target.value),
                  )
                }
              />

              <small>
                Detections below this value will not be displayed.
              </small>
            </div>
          </section>
        </div>

        <aside className="settings-side-column">
          <section className="full-page-panel settings-section">
            <div className="settings-section-header">
              <div className="settings-section-icon">
                <Bell size={20} />
              </div>

              <div>
                <h2>Notifications</h2>
                <p>Select which alerts should appear.</p>
              </div>
            </div>

            <div className="settings-toggle-list">
              <div className="settings-toggle-row">
                <div>
                  <strong>Critical alerts</strong>
                  <span>High-priority system and operational alerts.</span>
                </div>

                <button
                  type="button"
                  className={
                    settings.criticalAlerts
                      ? 'settings-switch settings-switch-active'
                      : 'settings-switch'
                  }
                  onClick={() =>
                    updateSetting(
                      'criticalAlerts',
                      !settings.criticalAlerts,
                    )
                  }
                  aria-pressed={settings.criticalAlerts}
                >
                  <span />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <strong>Warning alerts</strong>
                  <span>Operational warnings requiring attention.</span>
                </div>

                <button
                  type="button"
                  className={
                    settings.warningAlerts
                      ? 'settings-switch settings-switch-active'
                      : 'settings-switch'
                  }
                  onClick={() =>
                    updateSetting(
                      'warningAlerts',
                      !settings.warningAlerts,
                    )
                  }
                  aria-pressed={settings.warningAlerts}
                >
                  <span />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <strong>Information alerts</strong>
                  <span>Routine information and system events.</span>
                </div>

                <button
                  type="button"
                  className={
                    settings.infoAlerts
                      ? 'settings-switch settings-switch-active'
                      : 'settings-switch'
                  }
                  onClick={() =>
                    updateSetting('infoAlerts', !settings.infoAlerts)
                  }
                  aria-pressed={settings.infoAlerts}
                >
                  <span />
                </button>
              </div>
            </div>
          </section>

          <section className="full-page-panel settings-information-card">
            <SlidersHorizontal size={22} />

            <h2>Local configuration</h2>

            <p>
              These settings are currently stored only in the React component.
              They are not yet saved to the O-CEI backend.
            </p>
          </section>
        </aside>

        <div className="settings-actions">
          <div>
            {savedMessage && (
              <span className="settings-success-message">
                {savedMessage}
              </span>
            )}
          </div>

          <div>
            <button
              type="button"
              className="settings-reset-button"
              onClick={handleReset}
            >
              <RefreshCw size={16} />
              Reset
            </button>

            <button type="submit" className="settings-save-button">
              <Save size={16} />
              Save settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;