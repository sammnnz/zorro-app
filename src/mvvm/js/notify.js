import { bindings } from "./bindings.js";

const NotifyPropertyChanged = function (propertyName) {
    try {
        for (let id in bindings[propertyName]) {
            if (! bindings[propertyName].hasOwnProperty(id)) {
                continue
            }
            for (let attr in bindings[propertyName][id]) {
                if (! bindings[propertyName][id].hasOwnProperty(attr)) {
                    continue
                }

                document.dispatchEvent(bindings[propertyName][id][attr].events.notify)
            }
        }
    } catch (e) {
        console.warn(`Warning: Missing binding with ${propertyName} property.`)
    }
}

eel.expose(NotifyPropertyChanged, 'NotifyPropertyChanged')
