/**
 * Finds the closest element from candidates in a given direction using centroids and bounding client rects
 * @param direction - The direction to search in ("ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight")
 * @param ref - The reference element to measure distance from
 * @param candidates - Array of candidate elements to search through
 * @returns The closest candidate element in the specified direction, or null if no valid candidates
 */
export function findClosestInDirection(
  direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
  ref: HTMLElement | null,
  candidates: HTMLElement[]
): HTMLElement | null {
  if (!ref || candidates.length === 0) {
    return null;
  }

  const refRect = ref.getBoundingClientRect();
  const refCentroid = {
    x: refRect.left + refRect.width / 2,
    y: refRect.top + refRect.height / 2,
  };

  // Filter candidates based on direction
  let filteredCandidates: HTMLElement[] = [];

  switch (direction) {
    case "ArrowRight": {
      // Find elements to the right (centroid x > ref centroid x)
      filteredCandidates = candidates.filter((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.left + rect.width / 2 > refCentroid.x;
      });
      break;
    }
    case "ArrowLeft": {
      // Find elements to the left (centroid x < ref centroid x)
      filteredCandidates = candidates.filter((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.left + rect.width / 2 < refCentroid.x;
      });
      break;
    }
    case "ArrowDown": {
      // Find elements below (centroid y > ref centroid y)
      filteredCandidates = candidates.filter((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.top + rect.height / 2 > refCentroid.y;
      });
      break;
    }
    case "ArrowUp": {
      // Find elements above (centroid y < ref centroid y)
      filteredCandidates = candidates.filter((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.top + rect.height / 2 < refCentroid.y;
      });
      break;
    }
  }

  if (filteredCandidates.length === 0) {
    return null;
  }

  // Find the closest element from filtered candidates
  let closestElement: HTMLElement | null = null;
  let closestDistance = Infinity;

  for (const candidate of filteredCandidates) {
    const candidateRect = candidate.getBoundingClientRect();
    const candidateCentroid = {
      x: candidateRect.left + candidateRect.width / 2,
      y: candidateRect.top + candidateRect.height / 2,
    };

    const distance = Math.sqrt(
      Math.pow(candidateCentroid.x - refCentroid.x, 2) +
        Math.pow(candidateCentroid.y - refCentroid.y, 2)
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestElement = candidate;
    }
  }

  return closestElement;
}

