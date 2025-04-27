/*
* Top-frame buttons logic
*/
/**
 * @function
 * @name init
 * @param {jQuery | undefined} $context - Light/Shadow DOM for search
 * @returns {void}
 */
async function init ($context = undefined) {
    if (! $context) {
        $context = $(document);
    }

    const win = window.CurrentWindowAPI;

    const $cls_btn = $context.find('.close-btn'),
        $max_btn = $context.find('.maximize-btn'),
        $min_btn = $context.find('.minimize-btn');

    const windowClose = function () {
        win.close();
    }

    const windowMaximize = async function () {
        await win.isMaximized() ? win.unmaximize() : win.maximize()
    }

    const windowMinimize = function () {
        win.minimize();
    }

    const $max_btn_img = $max_btn.find('img');
    // TODO: add maximize/unmaximize with draggable mode
    const changeMaximizeButtonStyle = async function () {
        if (await win.isMaximized()) {
            $($max_btn_img[0]).attr('src', '/static/main/img/icon-maximize.svg');
        } else {
            $($max_btn_img[0]).attr('src', '/static/main/img/icon-unmaximize.svg');
        }
    };

    $cls_btn.click(windowClose);
    $max_btn.click(windowMaximize);
    $min_btn.click(windowMinimize);

    window?.electron.addListener('CurrentWindowAPI.maximize', () => {
        changeMaximizeButtonStyle()
    });

    window?.electron.addListener('CurrentWindowAPI.unmaximize', () => {
        changeMaximizeButtonStyle()
    });
}

await init($($('header .base-container')[0]?.shadowRoot));
