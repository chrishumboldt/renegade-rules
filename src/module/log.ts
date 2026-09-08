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

    if (stringify === true) {
      console.log(heading, JSON.stringify(value))
      return value
    }

    // console.dir gives a fully expanded, coloured view in Node and a plain
    // object dump in the browser. It pulls in no platform module, so this
    // stays safe to bundle for the browser.
    console.log(heading)
    console.dir(value, { depth: null, colors: true })

    return value
  }
}
