import { color, textFromBg } from '@/app/(inbox)/inbox/_components/inbox-comp';
import React from 'react';

function alternateDarkColor(hexColor, darknessFactor) {
  // Remove the '#' character if present
  hexColor = hexColor.replace('#', '');

  // Convert hexadecimal to RGB
  let r = parseInt(hexColor.substring(0, 2), 16);
  let g = parseInt(hexColor.substring(2, 4), 16);
  let b = parseInt(hexColor.substring(4, 6), 16);

  // Calculate darkened RGB values based on darkness factor
  r = Math.max(0, r - darknessFactor);
  g = Math.max(0, g - darknessFactor);
  b = Math.max(0, b - darknessFactor);

  // Convert RGB back to hexadecimal
  const darkHexColor = ((r << 16) + (g << 8) + b).toString(16).padStart(6, '0');

  // Prepend '#' to the darkened hexadecimal color
  return `#${darkHexColor}`;
}
function darkenHexColor(hex, percent) {
  // Remove the '#' character if present
  hex = hex?.replace('#', '');

  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.round(r * (1 - percent / 100));
  g = Math.round(g * (1 - percent / 100));
  b = Math.round(b * (1 - percent / 100));

  const darkenedHex = ((r << 16) + (g << 8) + b).toString(16).padStart(6, '0');

  return `#${darkenedHex}`;
}
function hexToRGBA(hex, opacity) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
function hexToDarkHex(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgb(${255 - r},${255 - g},${255 - b})`;
}
const randomColor = color[Math.floor(Math.random() * color.length)];
const Tag = ({ bg, color, children, ...rest }) => (
  <div
    {...rest}
    style={{
      backgroundColor: hexToRGBA(bg || randomColor, 0.3),
      color: darkenHexColor(color || textFromBg[randomColor], 20),
    }}
    className="px-2 py-[2px] inline-block w-[fit-content]  text-[12px] font-normal rounded-md shadow-sm"
  >
    {children}
  </div>
);

export default Tag;
