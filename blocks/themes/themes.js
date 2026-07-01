export default function decorate(block) {
  // First teaser is the tall feature card.
  if (block.firstElementChild) block.firstElementChild.classList.add('tall');
}
