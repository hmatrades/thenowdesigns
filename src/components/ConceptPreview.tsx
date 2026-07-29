import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type ConceptDirection,
  type ConceptPreviewSpec,
  ConceptPreviewError,
  renderConceptDocument,
  requestConceptPreview,
} from '../lib/conceptPreview'
import type { ScanReport } from '../lib/siteScan'

const PREVIEW_API_URL = (import.meta.env.VITE_PREVIEW_API_URL as string | undefined)?.trim() || ''

function hasUsableEndpoint(value: string): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
  } catch {
    return false
  }
}

export default function ConceptPreview({ report }: { report: ScanReport }) {
  const [direction, setDirection] = useState<ConceptDirection>('auto')
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [spec, setSpec] = useState<ConceptPreviewSpec | null>(null)
  const [error, setError] = useState('')
  const activeRequest = useRef<AbortController | null>(null)

  useEffect(() => () => activeRequest.current?.abort(), [])

  const document = useMemo(
    () => spec ? renderConceptDocument(spec, report.hostname) : '',
    [report.hostname, spec],
  )

  if (!hasUsableEndpoint(PREVIEW_API_URL)) return null

  const generate = async () => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setState('loading')
    setError('')

    try {
      const next = await requestConceptPreview(report, PREVIEW_API_URL, direction, controller.signal)
      setSpec(next)
      setState('done')
    } catch (caught) {
      if (controller.signal.aborted) return
      setError(
        caught instanceof ConceptPreviewError
          ? caught.message
          : 'The concept could not be generated. Your estimate is still ready below.',
      )
      setState('error')
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }

  return (
    <section className="scan-concept sec" aria-labelledby="concept-heading">
      <div className="wrap">
        <div className="scan-concept__head">
          <div>
            <span className="scan-kicker">Directional AI concept · optional</span>
            <h2 id="concept-heading">Picture a clearer version of your homepage.</h2>
          </div>
          <div>
            <p>
              Generate one fast, read-only direction from the public page and verified findings.
              It is inspiration—not the finished website or included repair scope.
            </p>
            <div className="scan-concept__generate">
              <label>
                <span>Direction</span>
                <select value={direction} onChange={(event) => setDirection(event.target.value as ConceptDirection)} disabled={state === 'loading'}>
                  <option value="auto">Designer’s choice</option>
                  <option value="clean">Clean and focused</option>
                  <option value="bold">Bold and expressive</option>
                  <option value="warm">Warm and approachable</option>
                </select>
              </label>
              <button className="btn btn--cherry" type="button" onClick={generate} disabled={state === 'loading'}>
                {state === 'loading' ? 'Building your concept…' : spec ? 'Regenerate concept' : 'Generate my concept'}
                <span className="arrow">{state === 'loading' ? '…' : '→'}</span>
              </button>
            </div>
          </div>
        </div>

        {state === 'loading' ? (
          <div className="scan-concept__loading" role="status" aria-live="polite">
            <span></span>
            <div>
              <strong>Turning the evidence into a homepage direction.</strong>
              <p>Clarifying the offer, hierarchy, sections, and calls to action. This normally takes a few moments.</p>
            </div>
          </div>
        ) : null}

        {state === 'error' ? (
          <div className="scan-concept__error" role="alert">
            <strong>The concept took a detour.</strong>
            <p>{error}</p>
            <button type="button" className="scan-text-button" onClick={generate}>Try once more</button>
          </div>
        ) : null}

        {spec && document ? (
          <div className="scan-concept-browser">
            <div className="scan-concept-browser__bar">
              <div aria-hidden="true"><span></span><span></span><span></span></div>
              <span>{report.hostname} · AI concept</span>
              <div className="scan-concept-browser__views" aria-label="Concept preview size">
                <button type="button" className={viewport === 'desktop' ? 'is-active' : ''} onClick={() => setViewport('desktop')}>Desktop</button>
                <button type="button" className={viewport === 'mobile' ? 'is-active' : ''} onClick={() => setViewport('mobile')}>Mobile</button>
              </div>
            </div>
            <div className={`scan-concept-browser__stage is-${viewport}`}>
              <iframe
                sandbox=""
                referrerPolicy="no-referrer"
                title={`Read-only AI homepage concept for ${report.hostname}`}
                srcDoc={document}
              />
            </div>
            <div className="scan-concept-browser__note">
              <span>AI concept</span>
              <span>Read only</span>
              <span>Draft copy</span>
              <span>No live buttons or forms</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
