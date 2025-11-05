export default function decorate(block) {
    const rows = [...block.querySelectorAll(':scope > div')];
  
    const image = rows[0]?.querySelector('div')?.textContent.trim();
    const title = rows[1]?.querySelector('div')?.textContent.trim();
    const subtitle = rows[2]?.querySelector('div')?.textContent.trim();
    const author = rows[3]?.querySelector('div')?.textContent.trim();
    const date = rows[4]?.querySelector('div')?.textContent.trim();
  
    block.innerHTML = `
      <div class="hero-image" style="background-image: url('${image}')">
        <div class="overlay">
          <h1>${title}</h1>
          <p class="subtitle">${subtitle}</p>
          <p class="meta">By ${author} • ${date}</p>
        </div>
      </div>
    `;
  }
  