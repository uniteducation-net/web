interface TallyEmbedProps {
  /** Tally form id, e.g. "Xxp0bO" from https://tally.so/r/Xxp0bO */
  formId: string;
  /** Accessible iframe title, shown to screen readers */
  title: string;
}

/**
 * Full-size Tally form embed.
 *
 * Renders the iframe with a direct `src` instead of Tally's `data-tally-src` +
 * `embed.js` bootstrap: the script only copies the attribute into `src` and
 * adds auto-resizing, which a full-viewport iframe doesn't need. Skipping it
 * keeps a third-party script off the critical path.
 */
const TallyEmbed = ({ formId, title }: TallyEmbedProps) => {
  return (
    <iframe
      src={`https://tally.so/r/${formId}?transparentBackground=1&formEventsForwarding=1`}
      title={title}
      className="absolute inset-0 size-full border-0"
    />
  );
};

export { TallyEmbed };
