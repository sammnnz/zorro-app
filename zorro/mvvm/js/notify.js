import { BindingsOn } from "./bindings.js";

const Bindings = await BindingsOn()

const NotifyPropertyChanged = function (propertyName) {
    try {
        for (let id in Bindings[propertyName]) {
            if (! Bindings[propertyName].hasOwnProperty(id)) {
                continue
            }
            for (let attr in Bindings[propertyName][id]) {
                if (! Bindings[propertyName][id].hasOwnProperty(attr)) {
                    continue
                }
                document.dispatchEvent(Bindings[propertyName][id][attr].events.notify)
            }
        }
    } catch (er) {
        console.warn(`Warning: Missing binding with ${propertyName} property.`)
    }
}

eel.expose(NotifyPropertyChanged, 'NotifyPropertyChanged')