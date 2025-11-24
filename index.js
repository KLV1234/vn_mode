// VN Mode Script v6.2.1 - Skip Button Moved to Bottom
jQuery(document).ready(function () {
    console.log("[VN Mode] Loading Extension v6.2.1 (Skip Button Relocated)...");

    // [상태 변수]
    let isVnModeOn = false;
    let vnParagraphs = [];
    let vnStep = 0;
    let lastUserPrompt = "";
    
    // 스킵 관련 상태 변수
    let isSkipping = false;

    // 설정 불러오기
    let ENABLE_USER_SPRITE = localStorage.getItem('vnModeUserSprite') === 'false' ? false : true;
    let ENABLE_PORTRAIT_MODE = localStorage.getItem('vnModePortrait') === 'true';

    let SAVED_CUSTOM_CSS_DRAFT = localStorage.getItem('vnModeCustomCSS') || ''; 
    let customThemes = JSON.parse(localStorage.getItem('vnModeCustomThemes') || '{}');
    let CURRENT_THEME = localStorage.getItem('vnModeTheme') || 'default';
    let CURRENT_FONT_SIZE = parseFloat(localStorage.getItem('vnModeFontSize')) || 1.7;

    // 버튼 커스텀 설정 변수
    let BTN_ICON_URL = localStorage.getItem('vnModeBtnIcon') || "";
    let BTN_SIZE = parseInt(localStorage.getItem('vnModeBtnSize')) || 40;
    let BTN_POS_X = parseInt(localStorage.getItem('vnModeBtnX')) || 20;
    let BTN_POS_Y = parseInt(localStorage.getItem('vnModeBtnY')) || 80;

    // BGM 관련 변수
    let bgmPlaylist = JSON.parse(localStorage.getItem('vnModeBgmPlaylist') || '[]'); 
    let bgmPresets = JSON.parse(localStorage.getItem('vnModeBgmPresets') || '{}');
    let bgmAudio = new Audio();
    let isBgmPlaying = false;
    let currentBgmIndex = -1;
    let bgmShuffle = false;
    let bgmLoopMode = 0; 

    // 타자기 및 기타 변수
    let isTyping = false;
    let typingTimer = null;
    let currentFullText = "";
    const TYPE_SPEED = 35;
    let currentLeftSrc = "";
    let currentRightSrc = "";
    let currentBgSrc = "";

    // -------------------------------------------------------
    // [0] 테마 프리셋 정의
    // -------------------------------------------------------
    const DEFAULT_PRESETS = {
        'default': `
#vn-dialog-box { background-color: #fffdf2; background-image: radial-gradient(#f3efd8 20%, transparent 20%); background-size: 20px 20px; border: 4px solid #fff; border-radius: 45px; box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.5) inset, 0 15px 25px rgba(90, 70, 50, 0.15); color: #5e5040; }
#vn-name-label { background: #ff4d4d; color: #fff; transform: rotate(-2deg); border-radius: 20px 20px 20px 0; top: -28px; left: 50px; box-shadow: 2px 4px 8px rgba(0,0,0,0.2); font-family: 'Jua', sans-serif; }
#vn-text-content { color: #5e5040; font-family: 'Jua', sans-serif; text-shadow: none; }
#vn-user-input { background: #fff4cc; border: 2px solid #f2d06b; color: #5e5040; border-radius: 30px; }
#vn-send-btn { background: #f2a900; border-radius: 25px; color: #fff; }
#vn-indicator { border-top-color: #f2a900; }`,
        'dark': `
#vn-dialog-box { background-color: rgba(20, 20, 25, 0.95); background-image: none; border: 2px solid #00bcd4; border-radius: 10px; box-shadow: 0 0 15px rgba(0, 188, 212, 0.4); color: #e0e0e0; }
#vn-name-label { background: #00bcd4; color: #000; font-family: monospace; transform: none; border-radius: 4px 4px 0 0; top: -30px; left: 0; font-weight: bold; letter-spacing: 2px; box-shadow: 0 0 10px #00bcd4; width: fit-content; padding: 5px 15px; }
#vn-text-content { color: #eee; font-family: 'Noto Sans KR', sans-serif; text-shadow: 1px 1px 2px #000; }
#vn-user-input { background: #333; border: 1px solid #555; color: #fff; border-radius: 4px; }
#vn-send-btn { background: #00bcd4; border-radius: 4px; color: #000; font-weight: 900; }
#vn-indicator { border-top-color: #00bcd4; }`,
        'modern': `
#vn-dialog-box { background-color: rgba(255, 255, 255, 0.95); background-image: none; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); color: #333; }
#vn-name-label { background: #333; color: #fff; font-family: 'Noto Serif KR', serif; transform: none; border-radius: 4px; top: -35px; left: 10px; font-size: 1.1em; padding: 4px 20px; }
#vn-text-content { color: #333; font-family: 'Noto Serif KR', serif; line-height: 1.8; text-shadow: none; }
#vn-user-input { background: #f5f5f5; border-bottom: 2px solid #333; border-radius: 0; border-top:0; border-left:0; border-right:0; color: #333; }
#vn-send-btn { background: #333; color: #fff; border-radius: 4px; }
#vn-indicator { border-top-color: #333; }`
    };

    // -------------------------------------------------------
    // [1] HTML UI 생성
    // -------------------------------------------------------
    const htmlTemplate = `
        <div id="vn-overlay">
            <div id="vn-background-layer"></div>
            <div id="vn-sprite-layer"></div>
            <div id="vn-choice-area"></div>
            <div id="vn-video-layer" style="display:none;">
                <video id="vn-scene-video" style="width:100%; height:100%; object-fit:cover; background:#000;" playsinline></video>
                <div id="vn-video-skip" title="Click to Skip">SKIP >></div>
            </div>

            <div id="vn-settings-area">
                <div id="vn-user-sprite-toggle" class="vn-top-btn" title="유저 이미지 ON/OFF"></div>
                <div id="vn-portrait-mode-toggle" class="vn-top-btn" title="초상화 모드 (Stardew Style)">🖼️ Portrait</div>
                <div id="vn-bgm-toggle-btn" class="vn-top-btn" title="BGM Control">🎵 BGM</div>
                </div>

            <div id="vn-history-panel">
                <div class="vn-history-container">
                    <div class="vn-history-header">
                        <span>📜 Chat History</span>
                        <div class="vn-history-close"><i class="fa-solid fa-xmark"></i></div>
                    </div>
                    <div id="vn-history-content"></div>
                </div>
            </div>

            <div id="vn-saveload-panel">
                <div class="vn-saveload-container">
                    <div class="vn-saveload-header">
                        <span id="vn-saveload-title">Save / Load</span>
                        <div class="vn-saveload-close"><i class="fa-solid fa-xmark"></i> Close</div>
                    </div>
                    <div id="vn-slots-grid" class="vn-slots-grid">
                        </div>
                </div>
            </div>

            <div id="vn-bgm-panel">
                <div id="vn-bgm-header">
                    <h4><i class="fa-solid fa-music"></i> Music Player</h4>
                    <div style="cursor:pointer;" onclick="$('#vn-bgm-panel').fadeOut(100)">X</div>
                </div>
                <div class="vn-player-controls">
                    <button id="vn-bgm-play-pause"><i class="fa-solid fa-play"></i></button>
                    <input type="range" id="vn-bgm-volume" min="0" max="1" step="0.1" value="0.5" title="Volume">
                </div>
                <div class="vn-bgm-sub-controls">
                    <button class="vn-sub-ctrl-btn" id="vn-bgm-prev"><i class="fa-solid fa-backward-step"></i></button>
                    <button class="vn-sub-ctrl-btn" id="vn-bgm-next"><i class="fa-solid fa-forward-step"></i></button>
                    <button class="vn-sub-ctrl-btn" id="vn-bgm-shuffle"><i class="fa-solid fa-shuffle"></i></button>
                    <button class="vn-sub-ctrl-btn" id="vn-bgm-loop"><i class="fa-solid fa-repeat"></i></button>
                </div>
                <ul id="vn-bgm-list"><li style="color:#aaa; text-align:center; padding:20px;">No music added.</li></ul>
                <div class="vn-bgm-inputs">
                    <input type="text" id="vn-bgm-name-input" placeholder="Track Name">
                    <input type="text" id="vn-bgm-url-input" placeholder="URL (mp3/ogg/wav)">
                    <button id="vn-bgm-add-btn">+</button>
                </div>
                <div class="vn-bgm-preset-area">
                    <h5><i class="fa-solid fa-list"></i> Playlist Library</h5>
                    <div class="vn-preset-row"><select id="vn-bgm-preset-select"><option value="">-- Select --</option></select></div>
                    <div class="vn-preset-row">
                        <button id="vn-bgm-load-preset" class="vn-small-btn btn-load" style="flex:1">Load</button>
                        <button id="vn-bgm-save-preset" class="vn-small-btn btn-save" style="flex:1">Save</button>
                        <button id="vn-bgm-del-preset" class="vn-small-btn btn-del"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <div class="vn-preset-io-row">
                        <button id="vn-bgm-preset-export" class="vn-small-btn btn-exp"><i class="fa-solid fa-download"></i> Export</button>
                        <button id="vn-bgm-preset-import" class="vn-small-btn btn-exp"><i class="fa-solid fa-upload"></i> Import</button>
                        <input type="file" id="vn-bgm-preset-file" accept=".json" style="display:none;">
                    </div>
                </div>
            </div>

            <div id="vn-close-btn" title="Close Mode">X</div>
            
            <div id="vn-preset-container">
                <button id="vn-preset-toggle-btn" title="Theme Settings"><i class="fa-solid fa-palette"></i> Theme</button>
                <div id="vn-preset-panel">
                    <h4>Display Settings</h4>
                    <div class="vn-setting-row" style="margin-bottom: 10px; background: #f9f9f9; padding: 8px; border-radius: 6px; border: 1px solid #eee;">
                        <label style="margin-bottom:5px; font-weight:bold; display:block;">Font Size</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="range" id="vn-font-size-slider" min="0.8" max="3.5" step="0.1" style="flex-grow: 1;">
                            <input type="number" id="vn-font-size-input" min="0.8" max="3.5" step="0.1" style="width: 50px;">
                        </div>
                    </div>
                    <div class="vn-setting-row" style="margin-bottom: 15px; background: #E3F2FD; padding: 8px; border-radius: 6px; border: 1px solid #BBDEFB;">
                        <label style="margin-bottom:5px; font-weight:bold; display:block; color:#1565C0;">🔘 ON/OFF Button Style</label>
                        <label style="font-size:0.8em; color:#555;">Icon URL</label>
                        <input type="text" id="vn-btn-icon-input" placeholder="http://..." style="width:100%; margin-bottom:5px; padding:4px; border:1px solid #ccc; border-radius:4px;">
                        <label style="font-size:0.8em; color:#555;">Button Size</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="range" id="vn-btn-size-slider" min="20" max="100" step="1" style="flex-grow: 1;">
                            <span id="vn-btn-size-val" style="font-size:0.85em; font-weight:bold; width:30px;">40px</span>
                        </div>
                    </div>
                    <label>Theme Preset:</label>
                    <select id="vn-theme-select"></select>
                    <div id="vn-custom-css-area">
                        <label>CSS Editor:</label>
                        <textarea id="vn-custom-css-input"></textarea>
                        <div class="vn-preset-controls" id="vn-preset-controls-box">
                            <input type="text" id="vn-new-preset-name" placeholder="New Theme Name" />
                            <div class="vn-btn-row">
                                <button id="vn-save-custom-btn">Save</button>
                                <button id="vn-delete-custom-btn" style="display:none;">Del</button>
                            </div>
                        </div>
                    </div>
                    <div class="vn-panel-actions"><button id="vn-apply-btn">Apply Changes</button></div>
                    <div class="vn-btn-row" style="margin-top:15px; border-top:1px dashed #ddd; padding-top:10px;">
                         <button id="vn-export-btn" style="background:#607D8B;">Export CSS</button>
                         <button id="vn-import-btn" style="background:#607D8B;">Import CSS</button>
                         <input type="file" id="vn-import-input" accept=".json" style="display:none;"/>
                    </div>
                </div>
            </div>

            <div id="vn-dialog-box">
                <div id="vn-bottom-controls">
                <div id="vn-menu-list">
                    <div id="vn-skip-btn" class="vn-bottom-btn" title="Skip">
                        <i class="fa-solid fa-forward"></i>
                    </div>
                    <div id="vn-history-btn" class="vn-bottom-btn" title="Log">
                        <i class="fa-solid fa-scroll"></i>
                    </div>
                    <div id="vn-load-btn" class="vn-bottom-btn" title="Load">
                        <i class="fa-solid fa-folder-open"></i>
                    </div>
                    <div id="vn-save-btn" class="vn-bottom-btn" title="Save">
                        <i class="fa-solid fa-floppy-disk"></i>
                    </div>
                </div>
                <div id="vn-menu-toggle-btn"><i class="fa-solid fa-plus"></i></div>
            </div>

                <div id="vn-name-label">Talk</div> 
                <div id="vn-portrait-box">
                    <img id="vn-portrait-img" src="" alt="portrait" />
                </div>
                <div id="vn-text-wrapper">
                    <div id="vn-text-content">...</div>
                    <div id="vn-input-area">
                        <textarea id="vn-user-input" placeholder="Type your message..."></textarea>
                        <div class="vn-input-buttons">
                            <button id="vn-trans-btn" title="Translate"><i class="fa-solid fa-language"></i></button>
                            <button id="vn-send-btn">SEND</button>
                        </div>
                    </div>
                </div>
                <div id="vn-indicator"></div>
            </div>
        </div>
        <style> /* CSS 파일에서 처리 */ </style>
    `;

    if ($('#vn-overlay').length === 0 || $('#vn-saveload-panel').length === 0) {
        $('#vn-overlay').remove(); 
        $('body').append(htmlTemplate); 
        console.log("[VN Mode] UI Updated to v6.2.1");
    }

    if ($('#vn-mode-theme-css').length === 0) { $('<style id="vn-mode-theme-css">').appendTo('head'); }

    if ($('#vn-toggle-btn').length === 0) {
        $('#top-bar').find('#vn-toggle-btn').remove();
        $('body').append(`<div id="vn-toggle-btn" title="VN Mode ON/OFF (Drag to move)"></div>`);
    }

    // -------------------------------------------------------
    // [2] 버튼 스타일 및 드래그 로직
    // -------------------------------------------------------
    function applyBtnStyle() {
        const $btn = $('#vn-toggle-btn');
        const fontSize = BTN_SIZE * 0.5; 
        $btn.css({
            'left': BTN_POS_X + 'px', 'top': BTN_POS_Y + 'px',
            'width': BTN_SIZE + 'px', 'height': BTN_SIZE + 'px',
            'min-width': BTN_SIZE + 'px', 'line-height': BTN_SIZE + 'px',
            'font-size': fontSize + 'px'
        });
        if (BTN_ICON_URL && BTN_ICON_URL.trim() !== "") {
            $btn.removeClass('fa-solid fa-book').text(""); 
            $btn.css({ 'background-image': `url('${BTN_ICON_URL}')`, 'background-size': 'contain', 'background-repeat': 'no-repeat', 'background-position': 'center', 'background-color': 'transparent', 'border': 'none', 'border-radius': '0', 'box-shadow': 'none' });
        } else {
            $btn.css('background-image', 'none').addClass('fa-solid fa-book');
            $btn.css({ 'background-color': 'rgba(30, 30, 30, 0.8)', 'border': '1px solid #444', 'border-radius': '50%', 'box-shadow': '' });
        }
        $('#vn-btn-icon-input').val(BTN_ICON_URL);
        $('#vn-btn-size-slider').val(BTN_SIZE);
        $('#vn-btn-size-val').text(BTN_SIZE + 'px');
    }

    function makeButtonDraggable() {
        const btn = document.getElementById('vn-toggle-btn');
        const $btn = $(btn);
        $btn.off('click'); 
        $(document).off('click', '#vn-toggle-btn');
        $(document).off('mousedown', '#vn-toggle-btn');
        $(document).off('touchstart', '#vn-toggle-btn');

        let isDragging = false; let hasMoved = false;
        let startX, startY; let initialLeft, initialTop; 
        let rafId = null; let currentX, currentY;

        function onStart(x, y) {
            isDragging = true; hasMoved = false; startX = x; startY = y;
            const rect = btn.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
            btn.style.transition = 'none'; btn.style.cursor = 'grabbing';
        }
        function updatePosition() {
            if (!isDragging) return;
            const dx = currentX - startX; const dy = currentY - startY;
            if (!hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) hasMoved = true;
            let newLeft = initialLeft + dx; let newTop = initialTop + dy;
            const maxLeft = window.innerWidth - btn.offsetWidth; const maxTop = window.innerHeight - btn.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxLeft)); newTop = Math.max(0, Math.min(newTop, maxTop));
            btn.style.left = newLeft + 'px'; btn.style.top = newTop + 'px';
            rafId = requestAnimationFrame(updatePosition);
        }
        function onMove(x, y) {
            if (!isDragging) return; currentX = x; currentY = y;
            if (!rafId) rafId = requestAnimationFrame(updatePosition);
        }
        function onEnd() {
            if (!isDragging) return; isDragging = false;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            btn.style.cursor = 'grab'; btn.style.transition = 'transform 0.1s, box-shadow 0.2s';
            const finalRect = btn.getBoundingClientRect();
            BTN_POS_X = parseInt(finalRect.left); BTN_POS_Y = parseInt(finalRect.top);
            localStorage.setItem('vnModeBtnX', BTN_POS_X); localStorage.setItem('vnModeBtnY', BTN_POS_Y);
        }

        btn.onmousedown = function(e) { if (e.button !== 0) return; e.preventDefault(); onStart(e.clientX, e.clientY); document.onmousemove = function(e) { e.preventDefault(); onMove(e.clientX, e.clientY); }; document.onmouseup = function() { onEnd(); document.onmousemove = null; document.onmouseup = null; }; };
        btn.addEventListener('touchstart', function(e) { if (e.touches.length > 1) return; const touch = e.touches[0]; onStart(touch.clientX, touch.clientY); }, { passive: false });
        btn.addEventListener('touchmove', function(e) { if (!isDragging) return; if (e.cancelable) e.preventDefault(); const touch = e.touches[0]; onMove(touch.clientX, touch.clientY); }, { passive: false });
        btn.addEventListener('touchend', function(e) { onEnd(); });
        btn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); if (!hasMoved) toggleVNMode(); };
        window.addEventListener('resize', function() { const rect = btn.getBoundingClientRect(); if (rect.right > window.innerWidth) btn.style.left = (window.innerWidth - rect.width - 10) + 'px'; if (rect.bottom > window.innerHeight) btn.style.top = (window.innerHeight - rect.height - 10) + 'px'; });
    }

    // -------------------------------------------------------
    // [3] 기본 로직 함수들
    // -------------------------------------------------------
    function extractNameFromSrc(src) { if (!src) return ""; try { const filename = decodeURIComponent(src.substring(src.lastIndexOf('/') + 1)); const namePart = filename.split('.')[0]; const parts = namePart.split('-'); let rawName = ""; if (parts[0].toLowerCase() === 'user' && parts.length > 1) { rawName = parts[1].split('_')[0]; } else { rawName = parts[0].split('_')[0]; } if (rawName.length > 0) { return rawName.charAt(0).toUpperCase() + rawName.slice(1); } return ""; } catch (e) { console.error(e); return ""; } }
    function updateNameLabel(src) { const name = extractNameFromSrc(src); const $label = $('#vn-name-label'); if (name) { $label.text(name).fadeIn(200); } else { $label.text("Talk"); } }

    function applyFontSize(size) {
        size = parseFloat(size); if (isNaN(size)) return;
        $('#vn-text-content').css('font-size', size + 'em');
        $('#vn-font-size-slider').val(size); $('#vn-font-size-input').val(size);
        CURRENT_FONT_SIZE = size; localStorage.setItem('vnModeFontSize', size);
    }

    function updateThemeSelect() {
        const $select = $('#vn-theme-select'); $select.empty();
        $select.append('<optgroup label="-- Basic --"></optgroup>');
        $select.append(new Option("Animal Crossing (Default)", "default"));
        $select.append(new Option("Cyber Dark", "dark"));
        $select.append(new Option("Modern Novel", "modern"));
        if (Object.keys(customThemes).length > 0) {
            $select.append('<optgroup label="-- My Themes --"></optgroup>');
            for (let name in customThemes) { $select.append(new Option(`Custom: ${name}`, name)); }
        }
        $select.append('<optgroup label="-- Edit --"></optgroup>');
        $select.append(new Option("📝 Write New / Edit CSS", "custom_draft"));
        if(CURRENT_THEME && (DEFAULT_PRESETS[CURRENT_THEME] || customThemes[CURRENT_THEME] || CURRENT_THEME === 'custom_draft')) { $select.val(CURRENT_THEME); } else { $select.val('default'); }
    }

    function applyTheme(themeKey) {
        let cssToApply = "";
        const $customArea = $('#vn-custom-css-area'); const $delBtn = $('#vn-delete-custom-btn');
        const $nameInput = $('#vn-new-preset-name'); const $textArea = $('#vn-custom-css-input'); const $controls = $('#vn-preset-controls-box');

        if (DEFAULT_PRESETS[themeKey]) {
            cssToApply = DEFAULT_PRESETS[themeKey];
            $textArea.val(cssToApply).prop('readonly', true).css('opacity', '0.7'); $controls.hide(); 
        } else if (customThemes[themeKey]) {
            cssToApply = customThemes[themeKey]; $customArea.show();
            $textArea.val(cssToApply).prop('readonly', false).css('opacity', '1');
            $nameInput.val(themeKey); $delBtn.show(); $controls.show();
        } else if (themeKey === 'custom_draft') {
            cssToApply = SAVED_CUSTOM_CSS_DRAFT; $customArea.show();
            $textArea.val(cssToApply).prop('readonly', false).css('opacity', '1');
            $nameInput.val(''); $delBtn.hide(); $controls.show();
        } else { cssToApply = DEFAULT_PRESETS['default']; }

        $('#vn-mode-theme-css').text(cssToApply); $('#vn-theme-select').val(themeKey);
        localStorage.setItem('vnModeTheme', themeKey);
    }

    function updatePortraitToggleState() {
        const $btn = $('#vn-portrait-mode-toggle'); const $dialog = $('#vn-dialog-box');
        const $spriteLayer = $('#vn-sprite-layer'); const $portraitBox = $('#vn-portrait-box');
        if (ENABLE_PORTRAIT_MODE) { $btn.removeClass('off').addClass('on').css({'background-color':'#009688', 'border-color':'#00796B'}); $dialog.addClass('vn-portrait-mode-active'); $spriteLayer.hide(); $portraitBox.show(); } else { $btn.removeClass('on').addClass('off').css({'background-color':'#607D8B', 'border-color':'#455A64'}); $dialog.removeClass('vn-portrait-mode-active'); $spriteLayer.show(); $portraitBox.hide(); }
    }

    function updateToggleButtonState() {
        const $btn = $('#vn-user-sprite-toggle');
        if (ENABLE_USER_SPRITE) $btn.removeClass('off').addClass('on').text('🧑 User Img: ON');
        else $btn.removeClass('on').addClass('off').text('🧑 User Img: OFF');
    }
    
    // [수정] 스킵 UI 업데이트 (글자 절대 안 쓰고 클래스만 넣었다 뺐다 함)
    function updateSkipUI() {
        const $btn = $('#vn-skip-btn');
        
        if (isSkipping) {
            // 스킵 중일 때: active 클래스만 추가 (노란불 들어오게)
            $btn.addClass('active'); 
            // 원래 있던 아이콘 태그를 건드리지 않음!
        } else {
            // 평소: active 클래스 제거
            $btn.removeClass('active');
        }
    }

    updateThemeSelect(); applyTheme(CURRENT_THEME); applyFontSize(CURRENT_FONT_SIZE);
    updateToggleButtonState(); updatePortraitToggleState();
    applyBtnStyle(); makeButtonDraggable();

// -------------------------------------------------------
    // [MISSING] 누락된 BGM 관련 함수들 (여기에 붙여넣기)
    // -------------------------------------------------------
    
    // 1. 플레이리스트 화면 갱신 함수
    function renderPlaylist() {
        const $list = $('#vn-bgm-list');
        $list.empty();
        
        if (bgmPlaylist.length === 0) {
            $list.append('<li style="color:#aaa; text-align:center; padding:20px;">No music added.</li>');
        } else {
            bgmPlaylist.forEach((track, index) => {
                const activeClass = (index === currentBgmIndex) ? 'active' : '';
                const $li = $(`<li class="${activeClass}">
                    <span class="vn-track-name">${index + 1}. ${track.name}</span>
                    <button class="vn-bgm-del-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </li>`);
                
                // 트랙 클릭 시 재생
                $li.on('click', function(e) {
                    if ($(e.target).closest('.vn-bgm-del-btn').length > 0) return;
                    playBgm(index);
                });

                // 삭제 버튼 클릭
                $li.find('.vn-bgm-del-btn').on('click', function(e) {
                    e.stopPropagation();
                    bgmPlaylist.splice(index, 1);
                    localStorage.setItem('vnModeBgmPlaylist', JSON.stringify(bgmPlaylist));
                    
                    if (currentBgmIndex === index) stopBgm();
                    else if (currentBgmIndex > index) currentBgmIndex--;
                    
                    renderPlaylist();
                });
                
                $list.append($li);
            });
        }
    }

    // 2. 프리셋(저장된 목록) UI 갱신 함수
    function updateBgmPresetUI() {
        const $select = $('#vn-bgm-preset-select');
        $select.empty();
        $select.append('<option value="">-- Select Playlist --</option>');
        for (let name in bgmPresets) {
            $select.append(new Option(name, name));
        }
    }

    // 3. 음악 재생 함수
    function playBgm(index) {
        if (index < 0 || index >= bgmPlaylist.length) return;
        
        // 이미 재생 중인 곡을 다시 누르면 리턴 (혹은 일시정지 로직으로 변경 가능)
        if (currentBgmIndex === index && isBgmPlaying) return;

        currentBgmIndex = index;
        const track = bgmPlaylist[index];
        
        bgmAudio.src = track.url;
        bgmAudio.load();
        
        const playPromise = bgmAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                isBgmPlaying = true;
                updateBgmUI();
                renderPlaylist(); // 활성화 표시 갱신
            }).catch(error => {
                console.error("[VN Mode] Audio Play Error:", error);
                if(window.toastr) toastr.error("Cannot play audio URL.");
                isBgmPlaying = false;
                updateBgmUI();
            });
        }
    }

    // 4. 음악 정지 함수
    function stopBgm() {
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
        isBgmPlaying = false;
        currentBgmIndex = -1;
        updateBgmUI();
        renderPlaylist();
    }

    // 5. 플레이어 UI 아이콘 상태 업데이트
    function updateBgmUI() {
        const $btn = $('#vn-bgm-play-pause');
        const $toggleBtn = $('#vn-bgm-toggle-btn');
        
        if (isBgmPlaying) {
            $btn.html('<i class="fa-solid fa-pause"></i>');
            $toggleBtn.addClass('playing');
        } else {
            $btn.html('<i class="fa-solid fa-play"></i>');
            $toggleBtn.removeClass('playing');
        }

        // 셔플/루프 버튼 상태
        $('#vn-bgm-shuffle').toggleClass('active', bgmShuffle);
        
        const $loopBtn = $('#vn-bgm-loop');
        $loopBtn.removeClass('active');
        $loopBtn.html('<i class="fa-solid fa-repeat"></i>'); // 기본
        
        if (bgmLoopMode === 1) { // 전체 반복
            $loopBtn.addClass('active');
        } else if (bgmLoopMode === 2) { // 한곡 반복
            $loopBtn.addClass('active');
            $loopBtn.html('<i class="fa-solid fa-repeat"></i> 1');
        }
    }

    // 6. 다음/이전 곡 로직
    function playNext() {
        if (bgmPlaylist.length === 0) return;
        
        let nextIndex;
        if (bgmShuffle) {
            nextIndex = Math.floor(Math.random() * bgmPlaylist.length);
        } else {
            nextIndex = currentBgmIndex + 1;
            if (nextIndex >= bgmPlaylist.length) {
                if (bgmLoopMode === 0) { stopBgm(); return; } // 반복 없음
                nextIndex = 0; // 전체 반복
            }
        }
        playBgm(nextIndex);
    }

    function playPrev() {
        if (bgmPlaylist.length === 0) return;
        let prevIndex = currentBgmIndex - 1;
        if (prevIndex < 0) prevIndex = bgmPlaylist.length - 1;
        playBgm(prevIndex);
    }

    // [초기화 실행]
    // 오디오 종료 시 자동 다음 곡 재생 이벤트
    bgmAudio.onended = function() {
        if (bgmLoopMode === 2) {
            bgmAudio.currentTime = 0;
            bgmAudio.play();
        } else {
            playNext();
        }
    };
    
    // 저장된 목록 불러오기
    renderPlaylist();
    updateBgmPresetUI();

    function toggleVNMode() {
        isVnModeOn = !isVnModeOn;
        const btn = $('#vn-toggle-btn');
        if (isVnModeOn) {
            btn.addClass('active'); $('body').addClass('vn-mode-active');
            checkLastMessage(); $('#vn-overlay').fadeIn(200); applyFontSize(CURRENT_FONT_SIZE);
        } else {
            btn.removeClass('active'); $('body').removeClass('vn-mode-active');
            $('#vn-overlay').fadeOut(200); if (typingTimer) clearTimeout(typingTimer); isTyping = false;
            // 스킵 끄기
            isSkipping = false; updateSkipUI();
        }
    }

    function openHistoryLog() {
        const $content = $('#vn-history-content');
        $content.empty();
        $('#chat .mes').each(function() {
            const $el = $(this);
            const isUser = $el.attr('is_user') === 'true';
            let name = $el.find('.name_text').text().trim();
            if (!name) { name = isUser ? "You" : "Character"; }
            let $mesTextClone = $el.find('.mes_text').clone();
            $mesTextClone.find('style, script, .mes_qr_fob').remove(); 
            $mesTextClone.find('br').replaceWith('\n');
            $mesTextClone.find('p').after('\n');
            let text = $mesTextClone.text();
            text = text.replace(/\n\s*\n\s*\n+/g, '\n\n').trim();
            if (!text || text === "...") return;
            let nameClass = 'system';
            if (isUser) nameClass = 'user';
            else if ($el.attr('is_system') !== 'true') nameClass = 'char';
            const entryHtml = `
                <div class="vn-log-entry">
                    <div class="vn-log-name ${nameClass}">${name}</div>
                    <div class="vn-log-text">${text}</div>
                </div>
            `;
            $content.append(entryHtml);
        });
        setTimeout(() => { $content.scrollTop($content[0].scrollHeight); }, 50);
        $('#vn-history-panel').css('display', 'flex').hide().fadeIn(200);
    }

    // -------------------------------------------------------
    // [4] 이벤트 리스너
    // -------------------------------------------------------
    function stopProp(e) { e.stopPropagation(); }
    // [추가] 플로팅 메뉴 토글 버튼 기능
    $('#vn-overlay').on('click', '#vn-menu-toggle-btn', function(e) {
        e.stopPropagation(); // 배경 클릭 방지
        const $container = $('#vn-bottom-controls');
        const $btn = $(this);
        
        // 메뉴 열기/닫기 클래스 토글
        $container.toggleClass('menu-open');
        $btn.toggleClass('active');
        
        // 아이콘 변경 (+ <-> x)
        if ($btn.hasClass('active')) {
            $btn.html('<i class="fa-solid fa-xmark"></i>'); // X 아이콘
        } else {
            $btn.html('<i class="fa-solid fa-plus"></i>'); // + 아이콘
        }
    });
    
    // [추가] 메뉴가 열려있을 때 다른 곳 누르면 메뉴 닫기
    $('#vn-overlay').on('click', function() {
        $('#vn-bottom-controls').removeClass('menu-open');
        $('#vn-menu-toggle-btn').removeClass('active').html('<i class="fa-solid fa-plus"></i>');
    });
    $('#vn-overlay').on('change input', '#vn-btn-icon-input', function(e) { BTN_ICON_URL = $(this).val(); localStorage.setItem('vnModeBtnIcon', BTN_ICON_URL); applyBtnStyle(); });
    $('#vn-overlay').on('input', '#vn-btn-size-slider', function(e) { BTN_SIZE = $(this).val(); localStorage.setItem('vnModeBtnSize', BTN_SIZE); applyBtnStyle(); });
    $('#vn-overlay').on('click', '#vn-history-btn', function(e) { stopProp(e); openHistoryLog(); });
    $('#vn-overlay').on('click', '.vn-history-close', function(e) { stopProp(e); $('#vn-history-panel').fadeOut(200); });
    $('#vn-overlay').on('click', '#vn-history-panel', function(e) { if (e.target === this) { $('#vn-history-panel').fadeOut(200); } });

    $('#vn-overlay').on('click', '#vn-portrait-mode-toggle', function(e) { stopProp(e); ENABLE_PORTRAIT_MODE = !ENABLE_PORTRAIT_MODE; localStorage.setItem('vnModePortrait', ENABLE_PORTRAIT_MODE); updatePortraitToggleState(); setTimeout(checkLastMessage, 100); });
    $('#vn-overlay').on('click', '#vn-bgm-toggle-btn', function(e) { stopProp(e); $('#vn-bgm-panel').fadeToggle(100); });
    $('#vn-overlay').on('click', '#vn-bgm-panel', stopProp);
    $('#vn-overlay').on('click', '#vn-bgm-play-pause', function(e) { stopProp(e); if (currentBgmIndex === -1 && bgmPlaylist.length > 0) playBgm(0); else if (currentBgmIndex !== -1) { if (bgmAudio.paused) { bgmAudio.play(); isBgmPlaying = true; } else { bgmAudio.pause(); isBgmPlaying = false; } updateBgmUI(); } });
    $('#vn-overlay').on('click', '#vn-bgm-prev', function(e) { stopProp(e); playPrev(); });
    $('#vn-overlay').on('click', '#vn-bgm-next', function(e) { stopProp(e); playNext(); });
    $('#vn-overlay').on('click', '#vn-bgm-shuffle', function(e) { stopProp(e); bgmShuffle = !bgmShuffle; updateBgmUI(); });
    $('#vn-overlay').on('click', '#vn-bgm-loop', function(e) { stopProp(e); bgmLoopMode = (bgmLoopMode + 1) % 3; updateBgmUI(); });
    $('#vn-overlay').on('input', '#vn-bgm-volume', function(e) { stopProp(e); bgmAudio.volume = $(this).val(); });
    $('#vn-overlay').on('click', '#vn-bgm-volume', stopProp);
    $('#vn-overlay').on('click', '#vn-bgm-add-btn', function(e) { stopProp(e); const name = $('#vn-bgm-name-input').val().trim(); const url = $('#vn-bgm-url-input').val().trim(); if (!name || !url) { if(window.toastr) toastr.warning("Enter name and URL."); return; } bgmPlaylist.push({ name: name, url: url }); localStorage.setItem('vnModeBgmPlaylist', JSON.stringify(bgmPlaylist)); $('#vn-bgm-name-input').val(''); $('#vn-bgm-url-input').val(''); renderPlaylist(); });
    $('#vn-overlay').on('click', '.vn-bgm-inputs', stopProp);
    $('#vn-overlay').on('click', '#vn-bgm-save-preset', function(e) { stopProp(e); if (bgmPlaylist.length === 0) { if(window.toastr) toastr.warning("Playlist is empty."); return; } const name = prompt("Enter preset name:"); if (!name || name.trim() === "") return; bgmPresets[name] = JSON.parse(JSON.stringify(bgmPlaylist)); localStorage.setItem('vnModeBgmPresets', JSON.stringify(bgmPresets)); updateBgmPresetUI(); $('#vn-bgm-preset-select').val(name); if(window.toastr) toastr.success(`Playlist "${name}" Saved!`); });
    $('#vn-overlay').on('click', '#vn-bgm-load-preset', function(e) { stopProp(e); const name = $('#vn-bgm-preset-select').val(); if (!name || !bgmPresets[name]) return; if (bgmPlaylist.length > 0 && !confirm(`Replace with "${name}"?`)) return; stopBgm(); bgmPlaylist = JSON.parse(JSON.stringify(bgmPresets[name])); currentBgmIndex = -1; localStorage.setItem('vnModeBgmPlaylist', JSON.stringify(bgmPlaylist)); renderPlaylist(); if(window.toastr) toastr.success(`Loaded "${name}"`); });
    $('#vn-overlay').on('click', '#vn-bgm-del-preset', function(e) { stopProp(e); const name = $('#vn-bgm-preset-select').val(); if (!name || !bgmPresets[name]) return; if (confirm(`Delete "${name}"?`)) { delete bgmPresets[name]; localStorage.setItem('vnModeBgmPresets', JSON.stringify(bgmPresets)); updateBgmPresetUI(); if(window.toastr) toastr.info("Preset deleted."); } });
    $('#vn-overlay').on('click', '#vn-bgm-preset-export', function(e) { stopProp(e); const blob = new Blob([JSON.stringify(bgmPresets, null, 2)], {type: "application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'vn_bgm_library.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); });
    $('#vn-overlay').on('click', '#vn-bgm-preset-import', function(e) { stopProp(e); $('#vn-bgm-preset-file').click(); });
    $('#vn-overlay').on('change', '#vn-bgm-preset-file', function(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const imported = JSON.parse(e.target.result); if (typeof imported !== 'object' || Array.isArray(imported)) throw new Error("Invalid format"); if (confirm("Merge?")) { bgmPresets = { ...bgmPresets, ...imported }; } else { bgmPresets = imported; } localStorage.setItem('vnModeBgmPresets', JSON.stringify(bgmPresets)); updateBgmPresetUI(); if(window.toastr) toastr.success("Library updated!"); } catch (err) { if(window.toastr) toastr.error("Invalid JSON."); } }; reader.readAsText(file); $(this).val(''); });
    $('#vn-overlay').on('input', '#vn-font-size-slider', function() { applyFontSize($(this).val()); });
    $('#vn-overlay').on('change keyup', '#vn-font-size-input', function() { applyFontSize($(this).val()); });
    $('#vn-overlay').on('change', '#vn-theme-select', function() { applyTheme($(this).val()); });
    $('#vn-overlay').on('click', '#vn-save-custom-btn', function(e) { stopProp(e); const name = $('#vn-new-preset-name').val().trim(); const css = $('#vn-custom-css-input').val(); if (!name) return; if (['default', 'dark', 'modern', 'custom_draft'].includes(name)) { alert("Reserved name."); return; } customThemes[name] = css; localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes)); updateThemeSelect(); applyTheme(name); if(window.toastr) toastr.success(`Theme "${name}" Saved!`); });
    $('#vn-overlay').on('click', '#vn-delete-custom-btn', function(e) { stopProp(e); const name = $('#vn-new-preset-name').val().trim(); if (customThemes[name] && confirm(`Delete?`)) { delete customThemes[name]; localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes)); updateThemeSelect(); applyTheme('default'); if(window.toastr) toastr.info(`Deleted.`); } });
    $('#vn-overlay').on('click', '#vn-apply-btn', function(e) { stopProp(e); const currentVal = $('#vn-theme-select').val(); if (DEFAULT_PRESETS[currentVal]) { $('#vn-mode-theme-css').text(DEFAULT_PRESETS[currentVal]); if(window.toastr) toastr.success(`Applied!`); $('#vn-preset-panel').hide(); return; } const css = $('#vn-custom-css-input').val(); if (currentVal === 'custom_draft') { SAVED_CUSTOM_CSS_DRAFT = css; localStorage.setItem('vnModeCustomCSS', css); } else if (customThemes[currentVal]) { customThemes[currentVal] = css; localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes)); } $('#vn-mode-theme-css').text(css); if(window.toastr) toastr.success('Applied!'); $('#vn-preset-panel').hide(); });
    $('#vn-overlay').on('click', '#vn-export-btn', function(e) { stopProp(e); const blob = new Blob([JSON.stringify(customThemes, null, 2)], {type: "application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'vn_mode_themes.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); });
    $('#vn-overlay').on('click', '#vn-import-btn', function(e) { stopProp(e); $('#vn-import-input').click(); });
    $('#vn-overlay').on('change', '#vn-import-input', function(e) { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { try { const imported = JSON.parse(e.target.result); customThemes = Object.assign({}, customThemes, imported); localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes)); updateThemeSelect(); if(window.toastr) toastr.success("Themes Imported!"); } catch (err) { alert("Invalid JSON."); } }; reader.readAsText(file); });
    $('#vn-overlay').on('click', '#vn-preset-toggle-btn', function(e) { stopProp(e); $('#vn-preset-panel').toggle(); });
    $('#vn-overlay').on('click', '#vn-preset-panel', stopProp);

    let isClickAction = true;
    $(document).on('mousedown', '#vn-toggle-btn', function() { isClickAction = true; });
    $(document).on('mousemove', '#vn-toggle-btn', function() { isClickAction = false; }); 
    $(document).on('click', '#vn-toggle-btn', function(e) { if (isClickAction) toggleVNMode(); });

    // 스킵 버튼 클릭 핸들러
    $('#vn-overlay').on('click', '#vn-skip-btn', function(e) {
        stopProp(e);
        isSkipping = !isSkipping;
        updateSkipUI();
        // 스킵을 켰는데 이미 멈춰있는 상태라면(대기중) 바로 진행
        if (isSkipping) {
            if (!isTyping) proceedNextStep();
        }
    });


    // -------------------------------------------------------
    // [5] 메인 로직
    // -------------------------------------------------------
    function openVN(dataArray) {
        if (!isVnModeOn) return;
        $('#vn-input-area').hide(); $('#vn-text-content').show(); $('#vn-indicator').show(); $('#vn-choice-area').empty().hide();
        vnParagraphs = (dataArray && dataArray.length > 0) ? dataArray : [{ text: "...", img: null, bg: null }];
        vnStep = 0; renderText();
    }

    function renderText() {
        if (vnStep >= vnParagraphs.length) return; 
        const currentData = vnParagraphs[vnStep];
        
        // 스킵 중인데 선택지가 있으면 스킵 멈춤
        if (isSkipping && currentData.choices && currentData.choices.length > 0) {
            isSkipping = false;
            updateSkipUI();
        }

        if (currentData.bg) changeBackground(currentData.bg);
        if (currentData.img) changeSprite(currentData.img);

        if (currentData.bgm) {
            if (currentData.bgm.type === 'stop') { stopBgm(); console.log("[VN Mode] 🛑 BGM Stopped via tag."); } 
            else if (currentData.bgm.type === 'play') {
                const targetName = currentData.bgm.name.toLowerCase();
                const foundIndex = bgmPlaylist.findIndex(track => track.name.toLowerCase() === targetName);
                if (foundIndex !== -1) { playBgm(foundIndex); console.log(`[VN Mode] 🎵 Auto-playing BGM: ${currentData.bgm.name}`); } 
                else { console.warn(`[VN Mode] ❌ BGM not found: ${currentData.bgm.name}`); }
            }
        }

        if (currentData.video) {
            console.log(`[VN Mode] 🎬 Playing Scene: ${currentData.video}`);
            playSceneVideo(currentData.video, function() { currentData.video = null; renderText(); });
            return; 
        }

        const hasChoices = currentData.choices && currentData.choices.length > 0;
        if ((!currentData.text || currentData.text.trim() === "") && !hasChoices) {
            vnStep++; 
            if (vnStep < vnParagraphs.length) { setTimeout(renderText, 10); } else { finishStory(); }
            return; 
        }

        $('#vn-choice-area').empty().hide(); typeText(currentData.text, currentData.choices);
    }

    function playSceneVideo(url, callback) {
        const $layer = $('#vn-video-layer'); const $video = $('#vn-scene-video'); const videoEl = $video[0];
        $video.attr('src', url); $layer.css('display', 'block'); 
        videoEl.play().catch(e => { console.error("Play error:", e); closeVideo(); });
        $('#vn-video-skip').off('click').one('click', function(e) { e.stopPropagation(); closeVideo(); });
        videoEl.onended = function() { closeVideo(); };
        function closeVideo() { videoEl.onended = null; videoEl.pause(); $video.attr('src', ''); $layer.css('display', 'none'); if (callback) callback(); }
    }

    function finishStory() {
        // 스토리 끝나면 스킵 끄기
        if (isSkipping) { isSkipping = false; updateSkipUI(); }
        $('#vn-text-content').hide(); $('#vn-indicator').hide(); $('#vn-input-area').css('display', 'flex'); $('#vn-user-input').focus();
    }

    // [수정된 배경 변경 함수] - 미리 로딩 후 부드러운 전환 (Cross-fade)
    // [최종 수정] 배경 변경 함수 - CSS 충돌 방지 및 부드러운 전환
    function changeBackground(src) {
        if (currentBgSrc === src) return;
        currentBgSrc = src;
        
        const $layer = $('#vn-background-layer');

        // 1. 새 이미지를 미리 로딩
        const img = new Image();
        img.src = src;

        img.onload = function() {
            // 2. 임시 레이어 생성 (투명도 0)
            const $newBg = $('<div class="vn-temp-bg"></div>').css({
                'position': 'absolute',
                'top': '0', 'left': '0',
                'width': '100%', 'height': '100%',
                'background-image': `url('${src}')`,
                'background-size': 'cover',
                'background-position': 'center',
                'z-index': '10',
                'opacity': '0'
            });

            $layer.append($newBg);

            // 3. 서서히 나타나기 (Fade In)
            $newBg.animate({ opacity: 1 }, 800, function() {
                // [중요] CSS 파일에 있는 기본 트랜지션 효과를 끔 (깜빡임 원인 제거)
                $layer.css('transition', 'none');
                
                // 4. 실제 배경 변경
                $layer.css('background-image', `url('${src}')`);
                
                // 5. 임시 레이어 삭제
                $newBg.remove();

                // (선택사항) 나중에 다시 켜질 수 있도록 0.1초 뒤 복구하되, 
                // 어차피 이 함수를 계속 쓸 거라면 꺼둬도 무방함. 
                // 안전을 위해 약간의 딜레이 후 복구:
                setTimeout(() => {
                     $layer.css('transition', 'background-image 0.8s ease-in-out');
                }, 100);
            });
        };
    }

    function typeText(text, choices) {
        const $content = $('#vn-text-content');
        
        // 스킵 중이면 텍스트 즉시 출력 후 다음 단계로
        if (isSkipping) {
            $content.text(text);
            isTyping = false;
            if (typingTimer) clearTimeout(typingTimer);
            $('#vn-indicator').hide();
            
            if (choices && choices.length > 0) {
                showChoices(choices);
                // 선택지에서는 스킵 강제 중단
                isSkipping = false;
                updateSkipUI();
            } else {
                // 선택지 없으면 빠르게 다음 문장으로
                setTimeout(proceedNextStep, 50);
            }
            return;
        }

        $content.text(''); currentFullText = text; isTyping = true; $('#vn-indicator').hide();
        if (typingTimer) clearTimeout(typingTimer);
        
        let i = 0;
        function typeNext() {
             // 타이핑 도중 스킵 켜졌는지 체크
            if (isSkipping) {
                // 재귀 호출하여 위의 isSkipping 블록을 타게 함
                typeText(text, choices);
                return;
            }

            if (i < text.length) { $content.text(text.substring(0, i + 1)); i++; typingTimer = setTimeout(typeNext, TYPE_SPEED); } 
            else { 
                isTyping = false; 
                if (choices && choices.length > 0) { showChoices(choices); $('#vn-indicator').hide(); } else { $('#vn-indicator').show(); }
                // 타이핑 끝났는데 스킵 모드면 넘어가기
                if (isSkipping) setTimeout(proceedNextStep, 50);
            }
        }
        if (!text || text.length === 0) { isTyping = false; if(choices) showChoices(choices); }
        else { typeNext(); }
    }

    // 다음 단계 진행 공통 함수
    function proceedNextStep() {
        if ($('#vn-choice-area').css('display') !== 'none') return; // 선택지 있으면 클릭으로만 진행
        
        vnStep++; 
        if (vnStep < vnParagraphs.length) { 
            renderText(); 
        } else { 
            finishStory(); 
        }
    }

    function showChoices(choices) {
        const $area = $('#vn-choice-area'); $area.empty();
        choices.forEach(choiceText => {
            const $btn = $('<div class="vn-choice-btn"></div>').text(choiceText);
            $btn.on('click', function(e) { e.stopPropagation(); const cleanText = choiceText.replace(/^\s*\d+[\.\)]\s*/, ''); sendUserMessage(cleanText); });
            $area.append($btn);
        });
        const $directBtn = $('<div class="vn-choice-btn direct-input">✍️ 직접 입력하기</div>');
        $directBtn.on('click', function(e) { e.stopPropagation(); $area.hide(); $('#vn-text-content').hide(); $('#vn-indicator').hide(); $('#vn-input-area').css('display', 'flex'); $('#vn-user-input').focus(); });
        $area.append($directBtn); $area.css('display', 'flex'); 
    }

    function changeSprite(src) {
        if (!src || src.toLowerCase().includes('background-') || src.toLowerCase().includes('bg-')) return;
        updateNameLabel(src);
        const filename = src.substring(src.lastIndexOf('/') + 1).toLowerCase();
        const isUser = filename.startsWith('user') || filename.includes('avatar');
        if (!ENABLE_USER_SPRITE && isUser) return;

        if (ENABLE_PORTRAIT_MODE) {
            const $portraitImg = $('#vn-portrait-img'); const $dialog = $('#vn-dialog-box');
            $portraitImg.attr('src', src);
            if (isUser) $dialog.addClass('reverse-row'); else $dialog.removeClass('reverse-row');
            return;
        }

        let activeClass = (!ENABLE_USER_SPRITE) ? 'center-pos' : (isUser ? 'right-pos' : 'left-pos');
        let inactiveClass = (!ENABLE_USER_SPRITE) ? 'center-pos' : (isUser ? 'left-pos' : 'right-pos');
        const $layer = $('#vn-sprite-layer');
        if (ENABLE_USER_SPRITE) {
            $layer.find(`.vn-character-sprite.${activeClass}`).removeClass('dimmed').css('z-index', 15);
            $layer.find(`.vn-character-sprite.${inactiveClass}`).addClass('dimmed').css('z-index', 5);
        } else { $layer.find(`.vn-character-sprite`).removeClass('dimmed').css('z-index', 15); }

        if ((!ENABLE_USER_SPRITE || !isUser)) { if (currentLeftSrc === src && currentLeftSrc !== "") return; currentLeftSrc = src; }
        if (ENABLE_USER_SPRITE && isUser) { if (currentRightSrc === src && currentRightSrc !== "") return; currentRightSrc = src; }
        const $oldActive = $layer.find(`.vn-character-sprite.${activeClass}`).not('.exiting');
        $oldActive.addClass('exiting');
        const userClass = isUser ? 'vn-user-sprite' : '';
        const $newImg = $('<img>', { src: src, class: `vn-character-sprite ${activeClass} ${userClass}`, css: { zIndex: 15 } });
        $layer.append($newImg); setTimeout(() => { $oldActive.remove(); }, 600);
    }

    function sendUserMessage(msg = null) {
        let inputVal = msg;
        if (!inputVal) { inputVal = $('#vn-user-input').val(); }
        const trimmedInput = inputVal.trim();
        const stInput = $('#send_textarea'); 
        stInput.val(inputVal); 
        stInput[0].dispatchEvent(new Event('input', { bubbles: true }));
        $('#send_but').click(); 
        $('#vn-user-input').val(''); $('#vn-input-area').hide(); $('#vn-choice-area').hide(); $('#vn-indicator').hide(); $('#vn-text-content').show();
        if (trimmedInput.length > 0) { lastUserPrompt = trimmedInput; $('#vn-text-content').text(lastUserPrompt); } else { lastUserPrompt = ""; $('#vn-text-content').text("..."); }
    }

    const checkLastMessage = () => {
        if (!isVnModeOn) return;
        const lastMsgElement = $('#chat').children('.mes').last();
        if (lastMsgElement.length === 0) return;
        
        const isUser = lastMsgElement.attr('is_user');
        if (isUser === "true" && !ENABLE_USER_SPRITE) { $('#vn-text-content').text("..."); return; }

        const messageContentDiv = lastMsgElement.find('.mes_text');
        let parsedSegments = []; let tempActiveImg = null; let tempActiveBg = null; let targetSource = messageContentDiv;
        
        const translatedBlock = messageContentDiv.find('.translated_text'); 
        if (translatedBlock.length > 0) targetSource = translatedBlock;

        targetSource.contents().each(function() {
            const node = $(this); 
            let foundImg = null;
            if (node.is('img')) foundImg = node.attr('src'); else if (node.find('img').length > 0) foundImg = node.find('img').attr('src');
            if (foundImg) { 
                // 이미지 경로 소문자로 변환 (대소문자 구분 없이 체크하기 위함)
                const lowerImg = foundImg.toLowerCase();
                
                // 1. 파일명에 'background-' 또는 'bg-'가 들어가는지 확인 (기존 기능)
                // 2. 경로에 'output'이 들어가는지 확인 (이미지 생성 시 보통 output 폴더에 저장됨)
                // 3. 'cache' 폴더나 'data:'(base64) 형태인지 확인
                if (lowerImg.includes('background-') || 
                    lowerImg.includes('bg-') || 
                    lowerImg.includes('user/images') || 
                    lowerImg.includes('cache') ||
                    lowerImg.startsWith('data:') || 
                    lowerImg.startsWith('blob:')) { 
                    
                    tempActiveBg = foundImg; // 조건에 맞으면 배경으로 설정
                } 
                else { 
                    tempActiveImg = foundImg; // 아니면 캐릭터로 설정
                }
            }

            let rawText = node.text(); 
            if (node.is('style') || node.is('script')) rawText = "";

            if (rawText && rawText.trim().length > 0) {
                let extractedChoices = null;
                const choiceMatch = rawText.match(/\{\{choices:\s*([\s\S]*?)\}\}/i);
                
                if (choiceMatch) {
                    let choiceContent = choiceMatch[1]; choiceContent = choiceContent.replace(/\n/g, ' ');
                    extractedChoices = choiceContent.split(/(?=\b\d+\.)/).map(s => s.trim()).filter(s => s.length > 0);
                    rawText = rawText.replace(/\{\{choices:[\s\S]*?\}\}/i, "");
                }

                const lines = rawText.split(/\n+/).filter(t => t.trim().length > 0);
                
                if (lines.length === 0 && extractedChoices) {
                    const imgToUse = (!ENABLE_USER_SPRITE && isUser === "true") ? null : tempActiveImg;
                    parsedSegments.push({ text: "", img: imgToUse, bg: tempActiveBg, bgm: null, choices: extractedChoices });
                } else {
                    lines.forEach((line, idx) => {
                        let lineText = line; let lineBgm = null; let lineVideo = null; 
                        if (/\[\[bgm-stop\]\]/i.test(lineText)) { lineBgm = { type: 'stop' }; lineText = lineText.replace(/\[\[bgm-stop\]\]/gi, ""); }
                        const startMatch = lineText.match(/\[\[bgm-start\s*:\s*(.*?)\s*\]\]/i);
                        if (startMatch) { lineBgm = { type: 'play', name: startMatch[1].trim() }; lineText = lineText.replace(/\[\[bgm-start\s*:\s*(.*?)\s*\]\]/gi, ""); }
                        const videoMatch = lineText.match(/\{\{scene-m\s*:\s*(.*?)\}\}/i);
                        if (videoMatch) { lineVideo = videoMatch[1].trim(); lineText = lineText.replace(/\{\{scene-m\s*:\s*(.*?)\}\}/gi, ""); }
                        const imgToUse = (!ENABLE_USER_SPRITE && isUser === "true") ? null : tempActiveImg;
                        const myChoices = (idx === lines.length - 1) ? extractedChoices : null;
                        parsedSegments.push({ text: lineText.trim(), img: imgToUse, bg: tempActiveBg, bgm: lineBgm, video: lineVideo, choices: myChoices });
                    });
                }
            }
        });
        if (parsedSegments.length > 0) openVN(parsedSegments);
    };

    $('#vn-overlay').on('click', '#vn-trans-btn', function (e) {
        stopProp(e); const $vnInput = $('#vn-user-input'); const originalText = $vnInput.val().trim(); if (!originalText) return;
        const $translatorBtn = $('#llm_translate_input_button'); const $realInput = $('#send_textarea'); if ($translatorBtn.length === 0) return;
        const $vnTransBtn = $(this); const originalBtnContent = $vnTransBtn.html();
        $vnTransBtn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i>'); $vnInput.prop('disabled', true);
        $realInput.val(originalText); const textBeforeTranslation = $realInput.val(); $translatorBtn.click();
        let checks = 0; const pollInterval = setInterval(() => {
            checks++; const currentRealText = $realInput.val();
            if (currentRealText !== textBeforeTranslation && currentRealText.trim() !== "") {
                clearInterval(pollInterval); $vnInput.val(currentRealText); $vnTransBtn.prop('disabled', false).html(originalBtnContent); $vnInput.prop('disabled', false).focus();
            } else if (checks >= 150) { clearInterval(pollInterval); $vnTransBtn.prop('disabled', false).html(originalBtnContent); $vnInput.prop('disabled', false).focus(); }
        }, 100);
    });
    $('#vn-overlay').on('click', '#vn-user-sprite-toggle', function(e) { stopProp(e); ENABLE_USER_SPRITE = !ENABLE_USER_SPRITE; localStorage.setItem('vnModeUserSprite', ENABLE_USER_SPRITE); updateToggleButtonState(); $('#vn-sprite-layer').empty(); currentLeftSrc = ""; currentRightSrc = ""; setTimeout(checkLastMessage, 100); });
    
    // 메인 클릭 이벤트: proceedNextStep 사용
    $('#vn-overlay').on('click', function (e) {
        if ($(e.target).closest('#vn-input-area, #vn-settings-area, #vn-bgm-panel, #vn-close-btn, #vn-preset-container, .vn-choice-btn, #vn-video-layer, #vn-history-btn, #vn-history-panel, #vn-saveload-panel, #vn-bottom-controls').length > 0) return;
        if (lastUserPrompt !== "" || $('#vn-text-content').text() === "...") return;
        if ($('#vn-video-layer').css('display') !== 'none') return;
        
        if (isTyping) { 
            clearTimeout(typingTimer); $('#vn-text-content').text(currentFullText); isTyping = false; 
            const currentChoices = vnParagraphs[vnStep] ? vnParagraphs[vnStep].choices : null;
            if (currentChoices && currentChoices.length > 0) { showChoices(currentChoices); $('#vn-indicator').hide(); } else { $('#vn-indicator').show(); }
            return; 
        }
        
        proceedNextStep();
    });

    $('#vn-send-btn').on('click', function(e) { stopProp(e); sendUserMessage(); });
    $('#vn-user-input').on('keydown', function (e) { stopProp(e); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUserMessage(); } });
    $('#vn-close-btn').on('click', function (e) { stopProp(e); if(isVnModeOn) toggleVNMode(); });
    
    const generationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && mutation.attributeName === "data-generating") {
                const isGenerating = document.body.getAttribute("data-generating");
                if (isGenerating === "true" && isVnModeOn) { 
                    $('#vn-input-area').hide(); $('#vn-choice-area').hide(); $('#vn-text-content').show(); $('#vn-indicator').hide(); 
                    if (lastUserPrompt) $('#vn-text-content').text(lastUserPrompt); else $('#vn-text-content').text("..."); 
                }
                if (!isGenerating || isGenerating === "false") { lastUserPrompt = ""; setTimeout(checkLastMessage, 200); }
            }
        });
    });
    generationObserver.observe(document.body, { attributes: true, attributeFilter: ["data-generating"] });
    
    // -------------------------------------------------------
    // [★ FIX] 캐릭터 변경 시 잔상 제거 (화면 초기화 로직)
    // -------------------------------------------------------
    function resetVisualState() {
        // 1. 상태 변수 초기화
        currentBgSrc = "";
        currentLeftSrc = "";
        currentRightSrc = "";
        lastUserPrompt = "";
        
        // 2. 화면 요소 즉시 제거
        $('#vn-background-layer').css('background-image', 'none'); // 배경 제거
        $('#vn-sprite-layer').empty();      // 스프라이트(캐릭터) 제거
        $('#vn-name-label').hide();         // 이름표 숨김
        $('#vn-text-content').text("...");  // 대화창 텍스트 초기화
        
        console.log("[VN Mode] Visual State Reset (Character Switched)");
    }

    const translationObserver = new MutationObserver((mutations) => {
        // [수정] 채팅방이 비워졌는지 확인 (캐릭터 변경 시 SillyTavern은 #chat을 비움)
        const chatDiv = document.getElementById('chat');
        if (chatDiv && chatDiv.children.length === 0) {
            resetVisualState();
            return;
        }

        // 기존 로직 유지
        if (!isVnModeOn) return; 
        if (window.vnTranslationDebounce) clearTimeout(window.vnTranslationDebounce);
        window.vnTranslationDebounce = setTimeout(() => checkLastMessage(), 300);
    });
    
    translationObserver.observe(document.getElementById('chat'), { childList: true, subtree: true, characterData: true });

    console.log("[VN Mode] Core Loaded.");

    // ======================================================
    // [★ FIX] 세이브 & 로드 로직 (캐릭터별 슬롯 분리 적용)
    // ======================================================
    const MAX_SLOTS = 6;
    let currentSaveMode = 'save'; // 'save' or 'load'

    // [HELPER] 현재 캐릭터에 맞는 저장소 키 가져오기
    function getStorageKey() {
        try {
            // SillyTavern 전역 컨텍스트 접근
            const context = SillyTavern.getContext();
            
            // 그룹 채팅인지 확인
            if (context.groupId) {
                // 그룹 채팅이면 그룹 ID를 키로 사용
                return `vnModeSaveSlots_Group_${context.groupId}`;
            }

            const charId = context.characterId;
            // 캐릭터가 선택되지 않았을 경우 기본 공용 슬롯 사용
            if (charId === undefined || charId === null) return 'vnModeSaveSlots'; 
            
            const char = context.characters[charId];
            if (!char || !char.avatar) return 'vnModeSaveSlots';

            // 캐릭터 아바타 파일명을 키로 사용하여 슬롯 분리
            return `vnModeSaveSlots_${char.avatar}`;
        } catch (e) {
            console.error("[VN Mode] Context Error:", e);
            return 'vnModeSaveSlots'; // 에러 발생 시 안전장치
        }
    }

    function getSaveSlots() {
        const key = getStorageKey();
        return JSON.parse(localStorage.getItem(key) || '{}');
    }

    // [SAVE] 현재 상태를 브랜치(새 파일)로 저장
    async function saveToSlot(slotId) {
        const context = SillyTavern.getContext();
        const charId = context.characterId;
        
        if (!charId && charId !== 0) {
            if(window.toastr) toastr.error("No character selected.");
            return;
        }

        const char = context.characters[charId];
        if (!char || !char.chat) {
             if(window.toastr) toastr.error("Character or chat data not found.");
             return;
        }

        // 1. 브랜치 파일명 생성 (원본이름_VN_Slot_번호_타임스탬프)
        const baseName = char.chat.replace('.jsonl', '');
        const branchName = `${baseName}_VN_Slot_${slotId}_${Date.now()}`; 

        // 2. 채팅 데이터 구조 보정: 메타데이터 블록(index 0) 추가
        const chatWithMetadata = [
            {
                user_name: context.name1,
                character_name: context.name2,
                create_date: context.chat_create_date || Date.now(),
                chat_metadata: context.chat_metadata || {}
            },
            ...context.chat
        ];

        // 3. API 요청 페이로드
        const savePayload = {
            ch_name: char.name,
            file_name: branchName,
            chat: chatWithMetadata,
            avatar_url: char.avatar
        };

        try {
            await $.ajax({
                url: '/api/chats/save',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(savePayload)
            });

            // 4. 성공 시 로컬 스토리지에 메타데이터 저장 (캐릭터 전용 키 사용)
            const slots = getSaveSlots();
            const now = new Date();
            
            slots[slotId] = {
                date: now.toLocaleString(),
                bgSrc: currentBgSrc,
                text: $('#vn-text-content').text(),
                leftChar: currentLeftSrc,
                rightChar: currentRightSrc,
                bgmName: currentBgmIndex >= 0 ? bgmPlaylist[currentBgmIndex].name : null,
                chatFileName: branchName 
            };
            
            // ★ 수정됨: 캐릭터별 키에 저장
            const key = getStorageKey();
            localStorage.setItem(key, JSON.stringify(slots));
            
            if(window.toastr) toastr.success(`Slot ${slotId} Saved (Branch Created)!`);
            renderSaveLoadGrid();

        } catch (e) {
            console.error("[VN Mode] Save Failed:", e);
            const errorMsg = e.responseText || e.statusText || "Unknown Error";
            if(window.toastr) toastr.error("Failed to create save branch: " + errorMsg);
        }
    }

    // [LOAD] 저장된 브랜치(파일) 불러오기 (수정됨: 복사본 생성 후 로드)
    async function loadFromSlot(slotId) {
        const slots = getSaveSlots();
        const data = slots[slotId];
        
        if (!data || !data.chatFileName) {
            if(window.toastr) toastr.warning("Empty Slot");
            return;
        }

        if (!confirm(`Load Slot ${slotId}?\nDate: ${data.date}\n(A new chat copy will be created)`)) return;

        try {
            let loadSuccess = false;
            const context = SillyTavern.getContext();
            const charId = context.characterId;
            const char = context.characters[charId];

            // 1. 원본 파일명 정리 (확장자 제거)
            const originalFileName = data.chatFileName.replace('.jsonl', '');

            // 2. 서버에서 원본 채팅 데이터 가져오기
            const chatData = await $.ajax({
                url: '/api/chats/get',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    ch_name: char.name,
                    file_name: originalFileName,
                    avatar_url: char.avatar
                })
            });

            // 3. 새로운 파일명 생성 (원본이름_Load_현재시간)
            // 이렇게 하면 로드할 때마다 새로운 채팅 파일이 생깁니다.
            const newBranchName = `${originalFileName}_Load_${Date.now()}`;

            // 4. 새 이름으로 채팅 데이터 저장 (복사본 생성)
            await $.ajax({
                url: '/api/chats/save',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    ch_name: char.name,
                    file_name: newBranchName,
                    chat: chatData,
                    avatar_url: char.avatar
                })
            });

            // 5. 새로 만든(복사된) 채팅 파일 열기
            if (typeof openCharacterChat === 'function') {
                await openCharacterChat(newBranchName);
                loadSuccess = true;
            } 
            else if (window.SillyTavern && typeof window.SillyTavern.openCharacterChat === 'function') {
                await window.SillyTavern.openCharacterChat(newBranchName);
                loadSuccess = true;
            }
            else if (SillyTavern.getContext && SillyTavern.getContext().openCharacterChat) {
                await SillyTavern.getContext().openCharacterChat(newBranchName);
                loadSuccess = true;
            }

            if (loadSuccess) {
                if (data.bgSrc) changeBackground(data.bgSrc);
                
                $('#vn-sprite-layer').empty();
                if (data.leftChar) changeSprite(data.leftChar);
                if (data.rightChar) changeSprite(data.rightChar);

                $('#vn-text-content').text(data.text);

                if (data.bgmName) {
                    const foundIndex = bgmPlaylist.findIndex(t => t.name === data.bgmName);
                    if (foundIndex !== -1 && currentBgmIndex !== foundIndex) {
                        playBgm(foundIndex);
                    }
                }

                $('#vn-saveload-panel').fadeOut(200);
                // 토스트 메시지 변경: 어떤 파일로 로드되었는지 알려줌
                if(window.toastr) toastr.success(`Loaded as new copy:\n${newBranchName}`);
            } else {
                throw new Error("Load function not found. Ensure SillyTavern is updated.");
            }

        } catch (e) {
            console.error("[VN Mode] Load Failed:", e);
            if(window.toastr) toastr.error("Failed to load chat file. Check console.");
        }
    }

    // [ADD] 슬롯 삭제 함수 (파일 삭제 기능 포함)
    async function deleteSlot(slotId) {
        if (!confirm(`Are you sure you want to delete Slot ${slotId}? This will also delete the save file.`)) return;
        
        const slots = getSaveSlots();
        const targetSlot = slots[slotId];

        // 1. 실제 파일 삭제 시도 (SillyTavern API 호출)
        if (targetSlot && targetSlot.chatFileName) {
            try {
                const context = SillyTavern.getContext();
                const charId = context.characterId;
                const char = context.characters ? context.characters[charId] : null;
                
                // 현재 캐릭터의 아바타 URL이 있어야 파일 경로를 찾을 수 있음
                if (char && char.avatar) {
                    let fileToDelete = targetSlot.chatFileName;
                    // 파일명에 .jsonl 확장자가 없으면 붙여줌 (SillyTavern 규칙)
                    if (!fileToDelete.endsWith('.jsonl')) {
                        fileToDelete += '.jsonl';
                    }

                    await $.ajax({
                        url: '/api/chats/delete',
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            chatfile: fileToDelete,
                            avatar_url: char.avatar
                        })
                    });
                    console.log(`[VN Mode] Successfully deleted branch file: ${fileToDelete}`);
                }
            } catch (e) {
                console.warn("[VN Mode] Failed to delete file (might be already missing):", e);
                // 파일 삭제에 실패하더라도(이미 파일이 없거나 등), 슬롯 데이터는 지워지도록 진행
            }
        }

        // 2. 슬롯 데이터(LocalStorage) 삭제
        delete slots[slotId]; 
        
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(slots));
        
        if(window.toastr) toastr.info(`Slot ${slotId} & File Deleted.`);
        renderSaveLoadGrid(); // 화면 갱신
    }

    // [UPDATE] 세이브/로드 그리드 그리기
    function renderSaveLoadGrid() {
        const $grid = $('#vn-slots-grid');
        $grid.empty();
        // getSaveSlots()가 이제 현재 캐릭터의 슬롯만 가져옴
        const slots = getSaveSlots();

        for (let i = 1; i <= MAX_SLOTS; i++) {
            const data = slots[i];
            const isPopulated = !!data;
            const thumbSrc = isPopulated && data.bgSrc ? data.bgSrc : '';
            const thumbStyle = thumbSrc ? `background-image: url('${thumbSrc}'); background-size: cover; background-position: center;` : 'background-color: #222;';
            
            const html = `
                <div class="vn-save-slot ${isPopulated ? '' : 'empty'}" data-id="${i}">
                    ${isPopulated ? `<div class="vn-slot-del-btn" title="Delete Slot"><i class="fa-solid fa-trash"></i></div>` : ''}
                    <div class="vn-slot-thumb" style="${thumbStyle}">
                        ${!thumbSrc ? '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#555;">Empty</span>' : ''}
                    </div>
                    <div class="vn-slot-info">
                        <div class="vn-slot-date">Slot ${i} ${isPopulated && data.date ? '- ' + data.date.split(',')[0] : ''}</div>
                        <div class="vn-slot-text">${isPopulated ? data.text : 'No Data'}</div>
                    </div>
                </div>
            `;
            const $el = $(html);

            $el.find('.vn-slot-del-btn').on('click', function(e) {
                e.preventDefault(); 
                e.stopPropagation(); 
                deleteSlot(i);
            });

            $el.on('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                if (currentSaveMode === 'save') {
                    if (isPopulated && !confirm(`Overwrite Slot ${i}? (New branch will be created)`)) return;
                    saveToSlot(i);
                } else {
                    if (isPopulated) loadFromSlot(i);
                    else if(window.toastr) toastr.warning("Empty Slot");
                }
            });
            $grid.append($el);
        }
    }

    function openSaveLoadPanel(mode) {
        currentSaveMode = mode;
        $('#vn-saveload-title').text(mode === 'save' ? '💾 Save Game (Create Branch)' : '📂 Load Game (Load Branch)');
        renderSaveLoadGrid();
        $('#vn-saveload-panel').css('display', 'flex').hide().fadeIn(200);
    }

    // 세이브/로드 패널 이벤트 바인딩
    $(document).on('click', '#vn-save-btn', function(e) { e.stopPropagation(); e.preventDefault(); openSaveLoadPanel('save'); });
    $(document).on('click', '#vn-load-btn', function(e) { e.stopPropagation(); e.preventDefault(); openSaveLoadPanel('load'); });
    $(document).on('click', '.vn-saveload-close', function(e) { e.stopPropagation(); $('#vn-saveload-panel').fadeOut(200); });
    $(document).on('click', '#vn-saveload-panel', function(e) { if (e.target === this) $(this).fadeOut(200); });

});

// ======================================================
// [VN Mode] Sprite & Dialog & Menu Settings Injector (Fixed & Resizable)
// ======================================================
(function() {
    // 1. 기본값 설정 (크기 조절 변수 추가됨)
    const DEFAULTS = {
        charScale: 1.0, charX: 0, charY: 0,
        userScale: 1.0, userX: 0, userY: 0,
        portraitSize: 180,
        dialogY: 40, dialogX: 0, dialogW: 95, dialogH: 250,
        // [신규] 메뉴 설정
        menuVisible: 'true', 
        menuRight: 25,       
        menuBottom: 25,
        menuScale: 1.0 // 기본 크기 1배
    };

    function getSettings() {
        return {
            charScale: localStorage.getItem('vnModeCharScale') || DEFAULTS.charScale,
            charX: localStorage.getItem('vnModeCharX') || DEFAULTS.charX,
            charY: localStorage.getItem('vnModeCharY') || DEFAULTS.charY,
            userScale: localStorage.getItem('vnModeUserScale') || DEFAULTS.userScale,
            userX: localStorage.getItem('vnModeUserX') || DEFAULTS.userX,
            userY: localStorage.getItem('vnModeUserY') || DEFAULTS.userY,
            portraitSize: localStorage.getItem('vnModePortraitSize') || DEFAULTS.portraitSize,
            dialogY: localStorage.getItem('vnModeDialogY') || DEFAULTS.dialogY,
            dialogX: localStorage.getItem('vnModeDialogX') || DEFAULTS.dialogX,
            dialogW: localStorage.getItem('vnModeDialogW') || DEFAULTS.dialogW,
            dialogH: localStorage.getItem('vnModeDialogH') || DEFAULTS.dialogH,
            // 메뉴 설정
            menuVisible: localStorage.getItem('vnModeMenuVisible') ?? DEFAULTS.menuVisible,
            menuRight: localStorage.getItem('vnModeMenuRight') || DEFAULTS.menuRight,
            menuBottom: localStorage.getItem('vnModeMenuBottom') || DEFAULTS.menuBottom,
            menuScale: localStorage.getItem('vnModeMenuScale') || DEFAULTS.menuScale
        };
    }

    const setVar = (name, val, unit='') => document.documentElement.style.setProperty(name, val + unit);

    // [핵심 수정] !important를 뚫고 스타일을 강제로 적용하는 함수
    function applyMenuSettings(s) {
        const $btn = $('#vn-bottom-controls');
        const el = $btn[0]; // DOM 요소 직접 선택
        
        if (!el) return;

        // 1. 보이기/숨기기
        if (s.menuVisible === 'true' || s.menuVisible === true) {
            $btn.show();
        } else {
            $btn.hide();
        }
        
        // 2. 위치 적용 (CSS !important 무시하고 강제 적용)
        el.style.setProperty('right', s.menuRight + 'px', 'important');
        el.style.setProperty('bottom', s.menuBottom + 'px', 'important');

        // 3. [신규] 크기 적용 (우측 하단 기준 스케일링)
        el.style.transformOrigin = 'bottom right'; // 구석을 기준으로 커지게
        el.style.transform = `scale(${s.menuScale})`;
    }

    function applyAllSettings() {
        const s = getSettings();
        setVar('--vn-char-scale', s.charScale); setVar('--vn-char-x', s.charX, 'px'); setVar('--vn-char-y', s.charY, 'px');
        setVar('--vn-user-scale', s.userScale); setVar('--vn-user-x', s.userX, 'px'); setVar('--vn-user-y', s.userY, 'px');
        setVar('--vn-portrait-size', s.portraitSize, 'px');
        setVar('--vn-dialog-y', s.dialogY, 'px'); setVar('--vn-dialog-x', s.dialogX, 'px');
        setVar('--vn-dialog-w', s.dialogW, '%'); setVar('--vn-dialog-h', s.dialogH, 'px');

        applyMenuSettings(s);
    }

    applyAllSettings();

    function createSliderHTML(id, label, min, max, step, val, unitSuffix='') {
        return `<div class="vn-slider-container"><div class="vn-slider-header"><span>${label}</span><span class="vn-slider-val" id="${id}-val">${val}${unitSuffix}</span></div><input type="range" id="${id}" class="vn-slider-range" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
    }

    function createToggleHTML(id, label, isChecked) {
        const checkedStr = (isChecked === 'true' || isChecked === true) ? 'checked' : '';
        return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; background:#f1f8e9; padding:8px; border-radius:6px;">
            <span style="font-size:0.9em; font-weight:bold; color:#33691E;">${label}</span>
            <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
              <input type="checkbox" id="${id}" ${checkedStr} style="opacity:0; width:0; height:0;">
              <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#ccc; transition:.4s; border-radius:34px;"></span>
              <style>
                #${id}:checked + .slider { background-color: #4CAF50; }
                #${id}:checked + .slider:before { transform: translateX(14px); }
                .slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
              </style>
            </label>
        </div>`;
    }

    function injectSpriteSliders() {
        const panel = document.getElementById('vn-preset-panel');
        if (!panel) return;
        if (document.getElementById('vn-sprite-sliders-area')) return;

        const sliderArea = document.createElement('div');
        sliderArea.id = 'vn-sprite-sliders-area';
        sliderArea.className = 'vn-sprite-settings-group';

        const s = getSettings();
        let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"><h5 style="margin:0;">🎨 상세 설정</h5><button id="vn-reset-settings-btn" style="background:#607D8B; color:white; border:none; border-radius:4px; padding:3px 8px; font-size:0.75em; cursor:pointer;">🔄 초기화</button></div>`;

        // [신규] 메뉴 버튼 설정 UI
        html += `<div style="margin-bottom:10px; font-size:0.85em; color:#FF5722; font-weight:bold;">[➕ 플로팅 버튼]</div>`;
        html += createToggleHTML('vn-menu-visible-toggle', '버튼 보이기', s.menuVisible);
        // 위치 슬라이더
        html += createSliderHTML('vn-menu-right-slider', '우측 여백 (Right)', 0, 350, 5, s.menuRight, 'px');
        html += createSliderHTML('vn-menu-bottom-slider', '하단 여백 (Bottom)', 0, 350, 5, s.menuBottom, 'px');
        // [추가] 크기 슬라이더
        html += createSliderHTML('vn-menu-scale-slider', '버튼 크기 (Scale)', 0.5, 2.0, 0.1, s.menuScale, 'x');
        
        html += `<hr style="border:1px dashed #ddd; margin:15px 0;">`;

        // 기존 설정들...
        html += `<div style="margin-bottom:10px; font-size:0.85em; color:#0288D1; font-weight:bold;">[💬 대화창]</div>`;
        html += createSliderHTML('vn-dialog-y-slider', '↕ 상하 (Bottom)', 0, 800, 10, s.dialogY, 'px');
        html += createSliderHTML('vn-dialog-x-slider', '↔ 좌우 (Offset)', -800, 800, 10, s.dialogX, 'px');
        html += createSliderHTML('vn-dialog-w-slider', '📏 너비 (Width)', 20, 100, 1, s.dialogW, '%');
        html += createSliderHTML('vn-dialog-h-slider', '📐 높이 (Height)', 100, 1200, 10, s.dialogH, 'px');

        html += `<div style="margin-top:15px; margin-bottom:10px; font-size:0.85em; color:#7B1FA2; font-weight:bold;">[캐릭터]</div>`;
        html += createSliderHTML('vn-char-scale-slider', '크기', 0.2, 3.0, 0.05, s.charScale, 'x');
        html += createSliderHTML('vn-char-x-slider', '가로 위치', -800, 800, 10, s.charX);
        html += createSliderHTML('vn-char-y-slider', '세로 위치', -500, 500, 10, s.charY);

        html += `<div style="margin-top:15px; margin-bottom:10px; font-size:0.85em; color:#388E3C; font-weight:bold;">[유저]</div>`;
        html += createSliderHTML('vn-user-scale-slider', '크기', 0.2, 3.0, 0.05, s.userScale, 'x');
        html += createSliderHTML('vn-user-x-slider', '가로 위치', -800, 800, 10, s.userX);
        html += createSliderHTML('vn-user-y-slider', '세로 위치', -500, 500, 10, s.userY);
        html += `<div style="margin-top:15px; margin-bottom:10px; font-size:0.85em; color:#E91E63; font-weight:bold;">[초상화]</div>`;
        html += createSliderHTML('vn-portrait-size-slider', '박스 크기', 50, 400, 5, s.portraitSize, 'px');

        sliderArea.innerHTML = html;
        panel.appendChild(sliderArea);

        // 기본 슬라이더 바인딩
        const bindSlider = (id, varName, storageKey, unit='') => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(id + '-val');
            if(el) {
                el.addEventListener('input', (e) => {
                    setVar(varName, e.target.value, unit);
                    let displayUnit = unit;
                    if (unit === '' && varName.includes('scale')) displayUnit = 'x';
                    valEl.innerText = e.target.value + displayUnit;
                    localStorage.setItem(storageKey, e.target.value);
                });
            }
        };

        // [수정] 메뉴 위치/크기 조절 로직 (CSS !important 무시)
        const updateMenuElement = (cssProp, val, unit='px') => {
             const el = document.getElementById('vn-bottom-controls');
             if(el) el.style.setProperty(cssProp, val + unit, 'important');
        };

        const bindMenuControl = (id, cssProp, storageKey, unit='px') => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(id + '-val');
            if(el) {
                el.addEventListener('input', (e) => {
                    const val = e.target.value;
                    updateMenuElement(cssProp, val, unit);
                    valEl.innerText = val + unit;
                    localStorage.setItem(storageKey, val);
                });
            }
        };

        // [추가] 메뉴 크기 스케일 조절
        const bindMenuScale = (id, storageKey) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(id + '-val');
            if(el) {
                el.addEventListener('input', (e) => {
                    const val = e.target.value;
                    const menu = document.getElementById('vn-bottom-controls');
                    if(menu) {
                        menu.style.transformOrigin = 'bottom right';
                        menu.style.transform = `scale(${val})`;
                    }
                    valEl.innerText = val + 'x';
                    localStorage.setItem(storageKey, val);
                });
            }
        };

        // 메뉴 이벤트 연결
        const menuToggle = document.getElementById('vn-menu-visible-toggle');
        if(menuToggle) {
            menuToggle.addEventListener('change', (e) => {
                const isVisible = e.target.checked;
                const menu = $('#vn-bottom-controls');
                if(isVisible) menu.show(); else menu.hide();
                localStorage.setItem('vnModeMenuVisible', isVisible);
            });
        }

        bindMenuControl('vn-menu-right-slider', 'right', 'vnModeMenuRight');
        bindMenuControl('vn-menu-bottom-slider', 'bottom', 'vnModeMenuBottom');
        bindMenuScale('vn-menu-scale-slider', 'vnModeMenuScale');

        // 기존 슬라이더 연결
        bindSlider('vn-dialog-y-slider', '--vn-dialog-y', 'vnModeDialogY', 'px');
        bindSlider('vn-dialog-x-slider', '--vn-dialog-x', 'vnModeDialogX', 'px');
        bindSlider('vn-dialog-w-slider', '--vn-dialog-w', 'vnModeDialogW', '%');
        bindSlider('vn-dialog-h-slider', '--vn-dialog-h', 'vnModeDialogH', 'px');

        bindSlider('vn-char-scale-slider', '--vn-char-scale', 'vnModeCharScale', '');
        bindSlider('vn-char-x-slider', '--vn-char-x', 'vnModeCharX', 'px');
        bindSlider('vn-char-y-slider', '--vn-char-y', 'vnModeCharY', 'px');

        bindSlider('vn-user-scale-slider', '--vn-user-scale', 'vnModeUserScale', '');
        bindSlider('vn-user-x-slider', '--vn-user-x', 'vnModeUserX', 'px');
        bindSlider('vn-user-y-slider', '--vn-user-y', 'vnModeUserY', 'px');

        bindSlider('vn-portrait-size-slider', '--vn-portrait-size', 'vnModePortraitSize', 'px');

        document.getElementById('vn-reset-settings-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if(confirm("초기화 하시겠습니까?")) {
                [
                    'vnModeCharScale', 'vnModeCharX', 'vnModeCharY',
                    'vnModeUserScale', 'vnModeUserX', 'vnModeUserY',
                    'vnModePortraitSize',
                    'vnModeDialogY', 'vnModeDialogX', 'vnModeDialogW', 'vnModeDialogH',
                    'vnModeMenuVisible', 'vnModeMenuRight', 'vnModeMenuBottom', 'vnModeMenuScale'
                ].forEach(k => localStorage.removeItem(k));
                applyAllSettings();
                document.getElementById('vn-sprite-sliders-area').remove();
                injectSpriteSliders();
            }
        });
    }

    setInterval(() => {
        injectSpriteSliders();
        const sprites = document.querySelectorAll('.vn-character-sprite');
        sprites.forEach(img => {
            if (img.src && (img.src.includes('user') || img.src.includes('User') || img.src.includes('avatar'))) {
                if (!img.classList.contains('vn-user-sprite')) img.classList.add('vn-user-sprite');
            }
        });
    }, 2000);
})();