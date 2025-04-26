import { UpdateBindings } from "../../../../../mvvm/js/bindings.js";
window.addEventListener('routesuccess', async () => {
    await UpdateBindings();
})