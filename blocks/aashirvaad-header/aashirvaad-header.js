/*
 * Copyright 2025 Franklin. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */

import { readBlockConfig } from '../../scripts/aem.js'; // Kept for potential future use, but not for block config

/**
 * Parses the block's table rows into a config object.
 * Skips the first row (block name), extracts key/value pairs from subsequent rows.
 * Handles multi-line text and pasted images. More robust: falls back to any child divs.
 * @param {Element} block The block element with child .row divs.
 * @returns {Object} Config object with keys like 'logo-url', 'nav-structure'.
 */
function parseBlockConfig(block) {
  console.log('parseBlockConfig: Starting parse on block', block); // Debug: Does it run?
  const config = {};
  const rows = [...block.children]; // Simpler: All direct children (rows), no :scope needed
  console.log('parseBlockConfig: Found rows', rows.length); // Expect 5 for your table
  for (let i = 1; i < rows.length; i += 1) { // Start at i=1 to skip block name row (i=0)
    const row = rows[i];
    console.log('parseBlockConfig: Processing row', i, row); // Log each row
    const cols = [...row.children]; // Direct children (cols)
    if (cols.length >= 2) {
      const keyCell = cols[0];
      const valueCell = cols[1];
      const keyP = keyCell.querySelector('p');
      const key = keyP ? keyP.textContent.trim().toLowerCase() : '';
      console.log('parseBlockConfig: Key from row', i, key); // Log key
      let value = '';
      const valueP = valueCell.querySelector('p');
      if (valueP) {
        value = valueP.textContent.trim();
      }
      const img = valueCell.querySelector('img');
      if (img) {
        value = img.src; // Extract src from pasted PNG
        console.log('parseBlockConfig: Found image src', value); // Log if image
      }
      console.log('parseBlockConfig: Value for', key, 'is', value); // Log value
      if (key && value) {
        config[key] = value;
      }
    } else {
      console.log('parseBlockConfig: Skipping row', i, '- not enough cols'); // If malformed
    }
  }
  console.log('parseBlockConfig: Final config', config); // Log full config
  return config;
}

/**
 * Parses the nav-structure config into a hierarchical array.
 * @param {string} navStructure The raw nav-structure string (with \n for lines).
 * @returns {Array} Array of nav items, each with optional sub-items.
 */
function parseNavStructure(navStructure) {
  console.log('parseNavStructure: Input', navStructure); // Debug
  if (!navStructure) {
    console.log('parseNavStructure: Using defaults');
    return [
      { label: 'Our Products', subItems: ['Atta', 'Salt', 'Organic', 'Bensan', 'Millets', 'Vermicelli', 'Rava', 'Naans & Parathas'] },
      { label: 'Our Story', subItems: [] },
      { label: 'Recipe', subItems: [] },
      { label: 'Blogs', subItems: [] },
      { label: 'FAQs', subItems: [] }
    ];
  }

  const lines = navStructure.split('\n').map((line) => line.trim()).filter((line) => line);
  console.log('parseNavStructure: Parsed lines', lines); // Log lines
  const navItems = [];

  lines.forEach((line) => {
    if (line.includes(':')) {
      const [parent, subsStr] = line.split(':', 2);
      const subItems = subsStr ? subsStr.split('|').map((sub) => sub.trim()).filter((sub) => sub) : [];
      navItems.push({ label: parent.trim(), subItems });
      console.log('parseNavStructure: Added parent', parent, 'with subs', subItems);
    } else {
      navItems.push({ label: line.trim(), subItems: [] });
      console.log('parseNavStructure: Added flat item', line);
    }
  });

  console.log('parseNavStructure: Final items', navItems);
  return navItems;
}

/**
 * Builds the nested nav DOM.
 * @param {Array} navItems The parsed nav items.
 * @returns {Element} The nav element.
 */
function buildNav(navItems) {
  console.log('buildNav: Building with', navItems.length, 'items'); // Debug
  const nav = document.createElement('nav');
  const ul = document.createElement('ul');
  ul.classList.add('nav');

  navItems.forEach((item, index) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${item.label.toLowerCase().replace(/\s+/g, '-')}`;
    a.textContent = item.label;
    a.classList.add('nav-item');
    a.setAttribute('aria-label', `Maps to ${item.label}`);
    li.appendChild(a);

    if (item.subItems && item.subItems.length > 0) {
      const dropdownUl = document.createElement('ul');
      dropdownUl.classList.add('dropdown');
      item.subItems.forEach((sub) => {
        const subLi = document.createElement('li');
        const subA = document.createElement('a');
        subA.href = `#${sub.toLowerCase().replace(/\s+/g, '-')}`;
        subA.textContent = sub;
        subA.classList.add('nav-item');
        subA.setAttribute('aria-label', `Maps to ${sub}`);
        subLi.appendChild(subA);
        dropdownUl.appendChild(subLi);
      });
      li.appendChild(dropdownUl);
    }

    ul.appendChild(li);
    console.log('buildNav: Added item', index + 1, item.label); // Log each
  });

  nav.appendChild(ul);
  console.log('buildNav: Nav built');
  return nav;
}

/**
 * Decorates the aashirvaad-header block.
 * @param {Element} block The header block element.
 */
export default async function decorate(block) {
  console.log('decorate: Starting decoration on block', block); // CRITICAL: Does decorate run?
  // Parse config from table rows
  const config = parseBlockConfig(block);

  // Extract config values with defaults
  let logoUrl = config['logo-url'] || `${window.hlx.codeBasePath}/icons/aashirvaad-logo.png`;
  console.log('decorate: Logo URL', logoUrl); // Log logo
  const navStructure = config['nav-structure'];
  const navItems = parseNavStructure(navStructure);
  const searchEnabled = config['search-enabled'] !== 'false';
  console.log('decorate: Search enabled?', searchEnabled); // Log search
  const isFixed = config.fixed === 'true';
  console.log('decorate: Fixed?', isFixed); // Log fixed

  // Clear existing content (table rows)
  block.innerHTML = '';
  console.log('decorate: Cleared block content');

  // Create header element
  const header = document.createElement('header');
  header.classList.add('aashirvaad-header');
  if (isFixed) {
    header.classList.add('fixed');
  }
  console.log('decorate: Created header element');
  
  // --- NEW CODE ---
  // Create hamburger icon
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = '<span></span><span></span><span></span>'; // 3 lines for the icon
  header.appendChild(hamburger);
  console.log('decorate: Added hamburger');

  // Add click listener for hamburger
  hamburger.addEventListener('click', () => {
    header.classList.toggle('nav-open');
    console.log('Toggled mobile nav');
  });
  // --- END OF NEW CODE ---

  // Create logo
  const logoImg = document.createElement('img');
  logoImg.src = logoUrl;
  logoImg.alt = 'Aashirvaad Logo';
  logoImg.classList.add('logo');
  header.appendChild(logoImg);
  console.log('decorate: Added logo to header');

  // Create navigation with dropdowns
  const nav = buildNav(navItems);
  header.appendChild(nav);
  console.log('decorate: Added nav to header');

  // Create search icon if enabled
  if (searchEnabled) {
    const searchIcon = document.createElement('div');
    searchIcon.classList.add('search-icon');
    searchIcon.innerHTML = '🔍'; // Simple emoji; replace with SVG if needed
    searchIcon.addEventListener('click', () => {
      // Placeholder: Open search modal or redirect
      console.log('Search clicked');
      window.location.href = '/search';
    });
    searchIcon.setAttribute('aria-label', 'Search');
    header.appendChild(searchIcon);
    console.log('decorate: Added search icon');
  }

  // Append header to block
  block.appendChild(header);
  console.log('decorate: Appended header to block');

  // Add keyboard support for dropdowns (basic)
  const topNavItems = header.querySelectorAll('.nav > li');
  topNavItems.forEach((li, index) => {
    const link = li.querySelector('a');
    if (li.querySelector('.dropdown')) {
      link.addEventListener('focus', () => li.classList.add('focused'));
      link.addEventListener('blur', () => li.classList.remove('focused'));
    }
    console.log('decorate: Added keyboard listener to item', index);
  });

  // Log decoration complete
  console.debug('Aashirvaad header with dropdowns decorated');
  console.log('decorate: Decoration complete!');
}