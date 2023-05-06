import { ColourLogItem, ColourLogName } from "@type/colour";

export const ColourLog = new Map<ColourLogName, ColourLogItem>()
  .set('black', {
    end: '[39m',
    start: '[30m',
  })
  .set('red', {
    end: '[39m',
    start: '[31m',
  })
  .set('green', {
    end: '[39m',
    start: '[32m',
  })
  .set('yellow', {
    end: '[39m',
    start: '[33m',
  })
  .set('blue', {
    end: '[39m',
    start: '[34m',
  })
  .set('magenta', {
    end: '[39m',
    start: '[35m',
  })
  .set('cyan', {
    end: '[39m',
    start: '[36m',
  })
  .set('white', {
    end: '[39m',
    start: '[37m',
  })
  .set('gray', {
    end: '[39m',
    start: '[90m',
  })

