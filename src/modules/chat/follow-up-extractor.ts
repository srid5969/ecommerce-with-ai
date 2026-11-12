/**
 * The model ends its reply with:
 *
 *   FOLLOW-UPS:
 *   - question 1
 *   - question 2
 *
 * This splits a streamed reply into the visible answer and that hidden list,
 * holding back only the start of each line until it's clear it isn't the marker.
 */
const MARKER = 'followups:';
const normalize = (text: string) => text.replace(/[\s*#_-]/g, '').toLowerCase();

export class FollowUpExtractor {
  private atLineStart = true;
  private lineHead = '';
  private found = false;
  private tail = '';

  /** Feed a chunk; returns the part that is safe to show as answer text. */
  push(delta: string): string {
    let visible = '';
    for (const char of delta) {
      if (this.found) {
        this.tail += char;
      } else if (!this.atLineStart) {
        visible += char;
        if (char === '\n') this.atLineStart = true;
      } else {
        this.lineHead += char;
        const head = normalize(this.lineHead);
        if (head.startsWith(MARKER)) {
          this.found = true;
          this.lineHead = '';
        } else if (char === '\n' || !MARKER.startsWith(head)) {
          visible += this.lineHead;
          this.lineHead = '';
          this.atLineStart = char === '\n';
        }
      }
    }
    return visible;
  }

  /** Call at the end of the stream; returns any held-back answer text. */
  flush(): string {
    const rest = this.found ? '' : this.lineHead;
    this.lineHead = '';
    return rest;
  }

  questions(limit = 3): string[] {
    return this.tail
      .split('\n')
      .map((line) =>
        line
          .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
          .replace(/\*+/g, '')
          .trim(),
      )
      .filter((line) => line.length > 3)
      .slice(0, limit);
  }
}
