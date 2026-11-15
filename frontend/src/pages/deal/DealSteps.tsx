import { DEAL_STEPS, dealStatusLabels, type DealStatus } from '../../entities/deal/model'

export function DealSteps({ status }: { status: DealStatus }) {
  if (status === 'cancelled' || status === 'in_review') {
    return <div className={`dealsteps__flag dealsteps__flag--${status}`}>{dealStatusLabels[status]}</div>
  }
  const current = DEAL_STEPS.findIndex((s) => s.status === status)
  return (
    <ol className="dealsteps" aria-label="Этапы сделки">
      {DEAL_STEPS.map((step, i) => (
        <li
          key={step.status}
          className={i < current ? 'is-done' : i === current ? 'is-current' : ''}
          aria-current={i === current ? 'step' : undefined}
        >
          <span className="dealsteps__dot">{i < current ? '✓' : i + 1}</span>
          <span className="dealsteps__label">{step.label}</span>
        </li>
      ))}
    </ol>
  )
}
