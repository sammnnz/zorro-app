import { UpdateBindings } from "../../../../../mvvm/js/bindings.js";

await UpdateBindings(router.getElementInTemplates); // In first load
window.addEventListener('routesuccess', async () => {
    await UpdateBindings(router.getElementInTemplates);
})