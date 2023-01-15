import { getTabInfo } from './tabutil';

export function setupBadgeCount() {
  chrome.tabs.onCreated.addListener(updateCount);
  chrome.tabs.onRemoved.addListener(updateCount);
  updateCount();
}

async function updateCount() {
  const { count } = await getTabInfo();

  let text: string;

  if (!count.incognito) {
    text = count.normal.toString();
  } else if (count.normal > 99 && count.incognito > 99) {
    text = `99/99`;
  } else if (count.normal > 99) {
    text = `99/${count.incognito}`;
  } else if (count.incognito > 99) {
    text = `${count.normal}/99`;
  } else {
    text = `${count.normal}/${count.incognito}`;
  }

  const color = getBadgeColor(count.all);
  await chrome.action.setBadgeBackgroundColor({
    color,
  });
  await chrome.action.setBadgeText({
    text,
  });
}

// 0x007A1F, hsl(135, 100%, 24%)
const goodColor = [0x00, 0x7a, 0x1f];
// 0x9B1C1C, hsl(0, 69%, 36%)
const badColor = [0x9b, 0x1c, 0x1c];

function getBadgeColor(tabCount: number) {
  // Because there will always be at least one tab open, and
  // it's normal for people to have multiple tabs open.
  // But once you're over 99, you're definitely in the red.
  tabCount = tabCount >= 99 ? tabCount : Math.max(1, tabCount - 20);

  const targetContribution = Math.min(tabCount / 99, 1.0);

  const hue = lerp(135, 0, targetContribution);
  const saturation = lerp(100, 69, targetContribution);
  const lightness = lerp(24, 36, targetContribution);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}
