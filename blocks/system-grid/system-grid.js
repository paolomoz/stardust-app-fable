export default function decorate(block) {
  // Mark wide tiles: any row whose first cell contains a picture.
  [...block.children].forEach((row) => {
    if (row.querySelector('picture')) row.classList.add('wide');
  });
}
