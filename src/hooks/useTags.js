import { useCallback } from "react";

/**
 * Stub hook for tag suggestion/filtering.
 *
 * The original implementation was never committed but `src/components/TagsInput.jsx`
 * imports and uses it. This stub keeps `TagsInput` loadable until a real
 * implementation is wired up against the GraphQL tag service.
 *
 * Returns no-op helpers that always produce an empty list — no suggestions,
 * no filtering. The component still renders and accepts user-typed tags via
 * its `onChange` callback, which is the only required behaviour.
 */
export function useTags() {
  // No-op stub: ignores args, always returns []. Real impl will read both.
  const getSuggestedTags = useCallback(() => [], []);
  const getFilteredTags = useCallback(() => [], []);

  return {
    getSuggestedTags,
    getFilteredTags,
    // Future surface (no-op for now)
    addTag: () => {},
    removeTag: () => {},
  };
}

export default useTags;
