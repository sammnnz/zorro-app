function init ($context) {
    let $left_menu = $context.find("#left-menu");

    let $left_menu_inner = $left_menu.find(".left-menu");
    $left_menu_inner.length === 0 ?
        $left_menu_inner = $($left_menu.find(".base-container")[0].shadowRoot).find(".left-menu") :
        undefined

    // const $shadowRoot = $($('#left-menu')[0].shadowRoot);

    // $left_menu.length === 0 ? $left_menu = $shadowRoot.find(".left-menu") : undefined
    $left_menu_inner.resizable();
}

init($($('#workspace .base-container')[0]?.shadowRoot))