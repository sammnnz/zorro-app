/**
 * @function
 * @name init
 * @param {jQuery | undefined | null} $context - Light/Shadow DOM for search
 * @returns {void}
 */
function init ($context = undefined) {
    if (! $context) {
        $context = $(document);
    }

    const $left_frame = $context.find("#left-frame"),
        $left_menu = $context.find("#left-menu");

    let $explorer_btn = $left_frame.find("#explorer-btn");
    $explorer_btn.length === 0 ?
        $explorer_btn = $($left_frame.find(".base-container")[0].shadowRoot).find("#explorer-btn") :
        undefined


    // let $file_btn = $context.find("#left-frame-file-btn"),
    //     $left_menu = $context.find("#left-menu");

    // const $left_frame = $("#left-frame");
    //

    // const $shadowRoot = $($context.find('#left-frame .base-container')[0]?.shadowRoot);
    // $file_btn.length === 0 ? $file_btn = $shadowRoot.find("#left-frame-file-btn") : undefined

    $left_menu.attr("style", "display: none")  // default
    const onClick = function (e) {
        if ($left_menu.css("display") === "flex") {
            $left_menu.css("display", "none")
            $(this).find("path").css("fill", "#555555")
        }
        else if ($left_menu.css("display") === "none") {
            $left_menu.css("display", "flex");
            $(this).find("path").css("fill", "#ffffff")
        }
    }

    $explorer_btn.click(onClick)
}

init($($('#workspace .base-container')[0]?.shadowRoot))
