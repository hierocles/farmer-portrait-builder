import { publicAsset } from '../lib/publicAsset'

export function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer sdv-wood-panel">
      <div className="app-footer__inner">
        <section className="app-footer__section sdv-wood-inset">
          <h3 className="app-footer__heading">About</h3>
          <p>
            Farmer Portrait Builder is a fan-made companion tool for configuring portrait packs
            compatible with the{' '}
            <strong>
              <a
                href="https://www.nexusmods.com/stardewvalley/mods/11398"
                target="_blank"
                rel="noopener noreferrer">
                Farmer Portraits
              </a>
            </strong>{' '}
            and{' '}
            <strong>
              <a
                href="https://www.nexusmods.com/stardewvalley/mods/21226"
                target="_blank"
                rel="noopener noreferrer">
                Farmer 2.0 ESWF
              </a>
            </strong>{' '}
            Stardew Valley mods. It runs entirely in your browser — portraits are stored locally on
            your device and are never uploaded to a server.
          </p>
          <p style={{ paddingTop: '10px' }}>
            Want to make your own portraits? Check out the{' '}
            <strong>
              <a
                href="https://jazzybee.itch.io/sdvcharactercreator"
                target="_blank"
                rel="noopener noreferrer">
                Stardew Valley Character Creator
              </a>
            </strong>{' '}
            by Jazzy Bee!
          </p>
          <p style={{ paddingTop: '10px' }}>
            The portrait folder layout and exported ESWF setup JSON are based on{' '}
            <strong>
              <a
                href="https://www.nexusmods.com/stardewvalley/mods/39037"
                target="_blank"
                rel="noopener noreferrer">
                Fern
              </a>
            </strong>{' '}
            by Dexnis, a Farmer 2.0 ESWF preset that fixed Weather Wonders paths and related
            portrait bugs. Exports also include updated setup files for{' '}
            <strong>
              <a
                href="https://www.nexusmods.com/stardewvalley/mods/21226"
                target="_blank"
                rel="noopener noreferrer">
                Farmer 2.0 ESWF
              </a>
            </strong>{' '}
            by Salty.
          </p>
        </section>

        <section className="app-footer__section sdv-wood-inset">
          <h3 className="app-footer__heading">Disclaimers</h3>
          <ul className="app-footer__list">
            <li>
              <strong>Stardew Valley</strong> is &copy; 2016-2026 ConcernedApe LLC. This project is
              not affiliated with, endorsed by, or sponsored by ConcernedApe or any rights holder of
              Stardew Valley. No game assets are included or redistributed.
            </li>
            <li>
              This software is provided <strong>&ldquo;as is&rdquo;</strong>, without warranty of
              any kind. You are responsible for verifying exported portrait packs work correctly in
              your game setup.
            </li>
            <li>
              <strong>AI Disclosure:</strong> This project was developed using AI coding assistance.
            </li>
          </ul>
        </section>

        <section className="app-footer__section sdv-wood-inset">
          <h3 className="app-footer__heading">Licenses</h3>
          <ul className="app-footer__list">
            <li>
              <strong>Farmer Portrait Builder</strong> —{' '}
              <a
                href="https://opensource.org/licenses/MIT"
                target="_blank"
                rel="noopener noreferrer">
                MIT License
              </a>{' '}
              &copy; {year} Farmer Portrait Builder contributors.{' '}
              <a href={publicAsset('/LICENSE')} target="_blank" rel="noopener noreferrer">
                Full license text
              </a>
              .
            </li>
            <li>
              <strong>NF Pixels</strong> typeface — &copy; 2020 Steve Gigou (
              <a href="mailto:steve@gigou.fr">steve@gigou.fr</a>
              ). Licensed under the{' '}
              <a
                href={publicAsset('/fonts/nf-pixels/LICENSE.txt')}
                target="_blank"
                rel="noopener noreferrer">
                SIL Open Font License 1.1
              </a>
              . Source:{' '}
              <a
                href="https://github.com/sgigou/NF-Pixels"
                target="_blank"
                rel="noopener noreferrer">
                NF-Pixels on GitHub
              </a>
              .
            </li>
          </ul>
        </section>
      </div>
    </footer>
  )
}
