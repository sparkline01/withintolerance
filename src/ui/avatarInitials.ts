/**
 * Two-letter initials for an NPC avatar badge, e.g. "Ruth" -> "RU",
 * "Professor Okafor" -> "PO", "the Registrar" -> "RE". A leading "the " is
 * stripped since it's a role-only name, not part of the identity.
 */
export function avatarInitials(name: string): string {
  const cleaned = name.replace(/^the\s+/i, '').trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
