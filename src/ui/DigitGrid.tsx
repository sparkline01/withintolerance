/**
 * The one signature visual element (spec §13.3): the headline number as a
 * fixed-width digit grid with a barely perceptible second layer beneath
 * it, very slightly out of registration — like a misprinted form where an
 * earlier value shows through. The back layer is driven by the hidden
 * truth signal the whole game, so it is never actually random noise; it's
 * illegible on purpose, not empty. It only resolves, in `--truth`, when
 * `resolved` is set — which must only ever happen on the debrief.
 */
export function DigitGrid({
  value,
  ghostValue,
  resolved = false,
}: {
  value: number
  ghostValue: number
  resolved?: boolean
}) {
  return (
    <span className={resolved ? 'digit-grid digit-grid-resolved' : 'digit-grid'}>
      <span className="digit-grid-back" aria-hidden="true">
        {ghostValue.toLocaleString()}
      </span>
      <span className="digit-grid-front">{value.toLocaleString()}</span>
    </span>
  )
}
