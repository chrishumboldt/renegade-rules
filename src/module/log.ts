import { ColourLog } from './colour'
import { ColourLogName } from '../type/colour'

export function logColour(colour: ColourLogName, input: any) {
  return `\x1b${ColourLog.get(colour)?.start}${input}\x1b${
    ColourLog.get(colour)?.end
  }`
}

export function logOut(prefix = 'LOG', stringify = true) {
  return (value: any) => {
    const heading = logColour('magenta', `[${prefix.toUpperCase()}]:`)

    if (typeof window === 'undefined' && stringify === false) {
      const util = require('util')

      console.log(
        heading,
        util.inspect(value, {
          showHidden: false,
          depth: null,
          colors: true,
        }),
      )
    } else {
      console.log(heading, stringify ? JSON.stringify(value) : value)
    }

    return value
  }
}
