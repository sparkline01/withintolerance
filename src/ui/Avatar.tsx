import { avatarInitials } from './avatarInitials'

/**
 * A small institutional initials badge for an NPC — in keeping with the
 * "validation report, not the organisation" visual language (spec §13),
 * not an illustrated character portrait.
 */
export function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar" aria-hidden="true">
      {avatarInitials(name)}
    </span>
  )
}
