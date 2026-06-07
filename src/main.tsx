import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { publicAsset } from './lib/publicAsset'
import './styles/fonts.css'
import App from './App'

const fontFace = document.createElement('style')
fontFace.textContent = `@font-face {
  font-family: 'NF Pixels';
  src: url('${publicAsset('/fonts/nf-pixels/NFPixels-Regular.ttf')}') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}`
document.head.appendChild(fontFace)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
