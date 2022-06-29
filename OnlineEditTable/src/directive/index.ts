import vClickOutside from './clickOutside.js'

const directive = [
    {
        name: 'focus',
        method: {
            mounted: (el: any) => el.focus()
        }
    },
    {
        name: 'clickOutside',
        method: vClickOutside
    }
]

export default directive