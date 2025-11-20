// VN Mode Script v4.5 - Added Export/Import Presets
jQuery(document).ready(function () {
    console.log("[VN Mode] Loading Extension v4.5 (Export/Import)...");

    // [상태 변수]
    let isVnModeOn = false;
    let vnParagraphs = [];
    let vnStep = 0;
    let lastUserPrompt = "";
    
    // 설정 불러오기
    let ENABLE_USER_SPRITE = localStorage.getItem('vnModeUserSprite') === 'false' ? false : true;
    let SAVED_CUSTOM_CSS_DRAFT = localStorage.getItem('vnModeCustomCSS') || ''; 
    let customThemes = JSON.parse(localStorage.getItem('vnModeCustomThemes') || '{}');
    let CURRENT_THEME = localStorage.getItem('vnModeTheme') || 'default';

    // 타자기 효과 변수
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
/* 기본: 동물의 숲 스타일 */
#vn-dialog-box {
    background-color: #fffdf2;
    background-image: radial-gradient(#f3efd8 20%, transparent 20%);
    background-size: 20px 20px;
    border: 4px solid #fff;
    border-radius: 45px;
    box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.5) inset, 0 15px 25px rgba(90, 70, 50, 0.15);
    color: #5e5040;
}
#vn-dialog-box::before {
    content: 'Talk'; background: #ff4d4d; color: #fff;
    transform: rotate(-3deg); border-radius: 30px; top: -25px; left: 50px;
    box-shadow: 2px 4px 8px rgba(0,0,0,0.2);
}
#vn-text-content { color: #5e5040; font-family: 'Jua', sans-serif; text-shadow: none; }
#vn-user-input { background: #fff4cc; border: 2px solid #f2d06b; color: #5e5040; border-radius: 30px; }
#vn-send-btn { background: #f2a900; border-radius: 25px; color: #fff; }
#vn-indicator { border-top-color: #f2a900; }`,
        'dark': `
/* 다크 모드: 깔끔한 검정 배경 */
#vn-dialog-box {
    background-color: rgba(20, 20, 25, 0.95);
    background-image: none;
    border: 2px solid #00bcd4;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 188, 212, 0.4);
    color: #e0e0e0;
}
#vn-dialog-box::before {
    content: 'LOG'; background: #00bcd4; color: #000;
    font-family: monospace; transform: none; border-radius: 4px; top: -15px; left: 20px;
    font-weight: bold; letter-spacing: 2px; box-shadow: 0 0 10px #00bcd4;
}
#vn-text-content { color: #eee; font-family: 'Noto Sans KR', sans-serif; text-shadow: 1px 1px 2px #000; }
#vn-user-input { background: #333; border: 1px solid #555; color: #fff; border-radius: 4px; }
#vn-send-btn { background: #00bcd4; border-radius: 4px; color: #000; font-weight: 900; }
#vn-indicator { border-top-color: #00bcd4; }`,
        'modern': `
/* 모던: 소설 스타일 */
#vn-dialog-box {
    background-color: rgba(255, 255, 255, 0.95);
    background-image: none;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    color: #333;
}
#vn-dialog-box::before { display: none; }
#vn-text-content { 
    color: #333; font-family: 'Noto Serif KR', serif; 
    font-size: 1.4em; line-height: 1.8; text-shadow: none;
}
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
            <div id="vn-settings-area">
                <div id="vn-user-sprite-toggle" title="유저 이미지 ON/OFF"></div>
            </div>
            <div id="vn-close-btn" title="Close Mode">X</div>
            <div id="vn-preset-container">
                <button id="vn-preset-toggle-btn" title="Theme Settings"><i class="fa-solid fa-palette"></i> Theme</button>
                <div id="vn-preset-panel">
                    <h4>Display Settings</h4>
                    <label>Theme Preset:</label>
                    <select id="vn-theme-select"></select>
                    
                    <div id="vn-custom-css-area">
                        <label>CSS Editor:</label>
                        <textarea id="vn-custom-css-input" placeholder="#vn-dialog-box { background: pink; }"></textarea>
                        
                        <div class="vn-preset-controls" id="vn-preset-controls-box">
                            <input type="text" id="vn-new-preset-name" placeholder="New Theme Name" />
                            <div class="vn-btn-row">
                                <button id="vn-save-custom-btn" title="Save as new preset"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                                <button id="vn-delete-custom-btn" title="Delete current preset" style="display:none;"><i class="fa-solid fa-trash"></i> Del</button>
                            </div>
                        </div>
                    </div>

                    <div class="vn-panel-actions">
                        <button id="vn-apply-btn">Apply Changes</button>
                    </div>

                    <div class="vn-btn-row" style="margin-top:15px; border-top:1px dashed #ddd; padding-top:10px;">
                        <button id="vn-export-btn" title="Export custom themes to JSON" style="background:#607D8B;"><i class="fa-solid fa-download"></i> Export</button>
                        <button id="vn-import-btn" title="Import JSON themes" style="background:#607D8B;"><i class="fa-solid fa-upload"></i> Import</button>
                        <input type="file" id="vn-import-input" accept=".json" style="display:none;"/>
                    </div>
                </div>
            </div>
            <div id="vn-dialog-box">
                <div id="vn-text-content">...</div>
                <div id="vn-input-area">
                    <textarea id="vn-user-input" placeholder="Type your message..."></textarea>
                    <div class="vn-input-buttons">
                        <button id="vn-trans-btn" title="Translate"><i class="fa-solid fa-language"></i></button>
                        <button id="vn-send-btn">SEND</button>
                    </div>
                </div>
                <div id="vn-indicator"></div>
            </div>
        </div>
    `;

    if ($('#vn-overlay').length === 0) {
        $('body').append(htmlTemplate);
    }

// 텍스트 삭제: 아이콘(fa-book)만 남김
const toggleBtnHtml = `<div class="fa-solid fa-book menu_button" id="vn-toggle-btn" title="VN Mode ON/OFF"></div>`;
    if ($('#vn-toggle-btn').length === 0) {
        $('#top-bar').append(toggleBtnHtml);
    }

    // -------------------------------------------------------
    // [2] 기본 CSS
    // -------------------------------------------------------
    if ($('#vn-mode-base-css').length === 0) {
        const baseCss = `
            @import url('https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR&family=Noto+Serif+KR&display=swap');
            #vn-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999; background: transparent; display: none; user-select: none; pointer-events: none; font-family: 'Jua', sans-serif; }
            #vn-background-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; background-color: rgba(0,0,0,0.3); background-size: cover; background-position: center; transition: background-image 0.8s; }
            #vn-sprite-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 5; overflow: hidden; }
            .vn-character-sprite { position: absolute; bottom: -20px; max-height: 90vh; max-width: 45vw; transition: all 0.6s; animation: fadeInSprite 0.6s ease-out forwards; }
            .vn-character-sprite.dimmed { filter: brightness(60%) grayscale(10%) blur(1px); }
            .vn-character-sprite.left-pos { left: 15%; transform-origin: bottom left; }
            .vn-character-sprite.right-pos { right: 15%; transform-origin: bottom right; }
            .vn-character-sprite.center-pos { left: 50%; transform: translateX(-50%); max-width: 55vw; }
            .vn-character-sprite.exiting { animation: fadeOutSprite 0.6s forwards; }
            @keyframes fadeInSprite { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOutSprite { from { opacity: 1; } to { opacity: 0; } }
            #vn-dialog-box { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 20; width: 95%; max-width: 1400px; min-height: 250px; display: flex; flex-direction: column; pointer-events: auto; padding: 50px 60px 40px 60px; box-sizing: border-box; transition: all 0.3s ease; }
            #vn-dialog-box::before { position: absolute; z-index: 25; padding: 5px 20px; display: block; }
            #vn-text-content { flex-grow: 1; margin-bottom: 10px; overflow-y: auto; max-height: 60vh; width: 100%; white-space: pre-wrap; line-height: 1.5; font-size: 1.7em;}
            #vn-text-content::-webkit-scrollbar { width: 6px; }
            #vn-text-content::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.2); border-radius: 10px; }
            #vn-input-area { display: none; width: 100%; gap: 15px; margin-top: auto; align-items: center; }
            .vn-input-buttons { display: flex; gap: 10px; }
            #vn-user-input { flex-grow: 1; height: 50px; resize: none; padding: 10px 20px; font-size: 1.3em; font-family: inherit; pointer-events: auto; }
            #vn-send-btn, #vn-trans-btn { height: 50px; border: none; cursor: pointer; font-weight: bold; font-size: 1.1em; pointer-events: auto; transition: transform 0.2s; }
            #vn-trans-btn { width: 50px; display: flex; align-items: center; justify-content: center; font-size: 1.3em; background: #4CAF50; color: white; border-radius: 25px; }
            #vn-indicator { position: absolute; bottom: 25px; right: 50px; width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 18px solid #f2a900; animation: float 0.8s infinite; display: none; }
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
            #vn-settings-area { position: absolute; top: 20px; left: 20px; z-index: 50; pointer-events: auto; }
            #vn-user-sprite-toggle { padding: 8px 12px; border-radius: 18px; cursor: pointer; font-weight: bold; color: #fff; }
            #vn-user-sprite-toggle.on { background: #4CAF50; }
            #vn-user-sprite-toggle.off { background: #FF9800; }
            #vn-close-btn { position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; background: rgba(255,255,255,0.8); border-radius: 50%; text-align: center; line-height: 40px; font-weight: bold; cursor: pointer; z-index: 100; pointer-events: auto; color: #333; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
            #vn-close-btn:hover { background: #f2a900; color: #fff; }
            #vn-preset-container { position: absolute; top: 70px; right: 20px; z-index: 90; pointer-events: auto; text-align: right; }
            #vn-preset-toggle-btn { background: rgba(0,0,0,0.6); color: #fff; border: 1px solid #555; padding: 5px 12px; border-radius: 15px; cursor: pointer; font-size: 0.9em; backdrop-filter: blur(4px); transition: 0.2s; }
            #vn-preset-toggle-btn:hover { background: #fff; color: #000; }
            #vn-preset-panel { 
                display: none; margin-top: 10px; background: rgba(255,255,255,0.98); border-radius: 12px; 
                padding: 15px; width: 300px; box-shadow: 0 5px 25px rgba(0,0,0,0.4); text-align: left;
                border: 1px solid #ccc;
            }
            #vn-preset-panel h4 { margin: 0 0 10px 0; font-size: 1em; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            #vn-preset-panel label { display: block; font-size: 0.85em; color: #555; margin-bottom: 4px; }
            #vn-preset-panel select { width: 100%; padding: 5px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #ddd; }
            #vn-preset-panel textarea { width: 100%; height: 80px; padding: 5px; font-size: 0.8em; font-family: monospace; border: 1px solid #ddd; resize: vertical; background: #f9f9f9; margin-bottom: 8px; white-space: pre; overflow-x: auto; }
            .vn-preset-controls { background: #f0f0f0; padding: 8px; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 8px; }
            #vn-new-preset-name { width: 100%; padding: 5px; margin-bottom: 5px; border: 1px solid #ccc; border-radius: 3px; font-size: 0.9em; box-sizing: border-box; }
            .vn-btn-row { display: flex; gap: 5px; }
            .vn-btn-row button { flex: 1; padding: 6px 5px; font-size: 0.85em; cursor: pointer; border-radius: 3px; border: none; color: white; transition: 0.2s; }
            .vn-btn-row button:hover { opacity: 0.9; }
            #vn-save-custom-btn { background: #4CAF50; }
            #vn-delete-custom-btn { background: #f44336; }
            .vn-panel-actions { margin-top: 10px; text-align: right; border-top: 1px solid #eee; padding-top: 10px; }
            #vn-apply-btn { background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-size: 0.9em; font-weight: bold; width: 100%; }
            #vn-apply-btn:hover { background: #1976D2; }
            @media (max-width: 900px) {
                /* 여기 수치를 아래와 같이 수정하세요 */
                .vn-character-sprite { 
                    max-height: 85vh !important; 
                    max-width: 150vw !important; 
                    bottom: -20px !important; 
                }
                /* .vn-character-sprite 아래쪽 설정들은 그대로 둡니다 */
                #vn-dialog-box { bottom: 10px; min-height: 180px; padding: 20px; max-width: 98%; }
                #vn-text-content { font-size: 0.9em; }
                #vn-preset-container { top: 60px; right: 10px; }
                #vn-preset-panel { width: 260px; right: 0; }
            }
            #vn-toggle-btn { cursor: pointer; font-weight: bold; color: #aaa; margin-left: 10px; border: 1px solid #444; padding: 2px 10px; border-radius: 4px; }
            #vn-toggle-btn:hover { color: #fff; border-color: #888; }
            #vn-toggle-btn.active { color: #fff; background-color: #ff6b6b; border-color: #ff6b6b; box-shadow: 0 0 8px rgba(255, 107, 107, 0.5); }
        `;
        $('<style id="vn-mode-base-css">').text(baseCss).appendTo('head');
    }
    
    if ($('#vn-mode-theme-css').length === 0) {
        $('<style id="vn-mode-theme-css">').appendTo('head');
    }

    // -------------------------------------------------------
    // [3] 함수 및 로직
    // -------------------------------------------------------

    function updateThemeSelect() {
        const $select = $('#vn-theme-select');
        $select.empty();
        $select.append('<optgroup label="-- Basic --"></optgroup>');
        $select.append(new Option("Animal Crossing (Default)", "default"));
        $select.append(new Option("Cyber Dark", "dark"));
        $select.append(new Option("Modern Novel", "modern"));
        if (Object.keys(customThemes).length > 0) {
            $select.append('<optgroup label="-- My Themes --"></optgroup>');
            for (let name in customThemes) {
                $select.append(new Option(`Custom: ${name}`, name));
            }
        }
        $select.append('<optgroup label="-- Edit --"></optgroup>');
        $select.append(new Option("📝 Write New / Edit CSS", "custom_draft"));
        
        // 현재 선택된 테마가 유효한지 확인 후 값 설정
        if(CURRENT_THEME && (DEFAULT_PRESETS[CURRENT_THEME] || customThemes[CURRENT_THEME] || CURRENT_THEME === 'custom_draft')) {
            $select.val(CURRENT_THEME);
        } else {
            $select.val('default');
        }
    }

    function applyTheme(themeKey) {
        let cssToApply = "";
        const $customArea = $('#vn-custom-css-area');
        const $delBtn = $('#vn-delete-custom-btn');
        const $nameInput = $('#vn-new-preset-name');
        const $textArea = $('#vn-custom-css-input');
        const $controls = $('#vn-preset-controls-box');

        if (DEFAULT_PRESETS[themeKey]) {
            cssToApply = DEFAULT_PRESETS[themeKey];
            $textArea.val(cssToApply); 
            $textArea.prop('readonly', true).css('opacity', '0.7'); 
            $controls.hide(); 
        } 
        else if (customThemes[themeKey]) {
            cssToApply = customThemes[themeKey];
            $customArea.show();
            $textArea.val(cssToApply).prop('readonly', false).css('opacity', '1');
            $nameInput.val(themeKey); 
            $delBtn.show();
            $controls.show();
        } 
        else if (themeKey === 'custom_draft') {
            cssToApply = SAVED_CUSTOM_CSS_DRAFT;
            $customArea.show();
            $textArea.val(cssToApply).prop('readonly', false).css('opacity', '1');
            $nameInput.val(''); 
            $delBtn.hide();
            $controls.show();
        }
        else {
            cssToApply = DEFAULT_PRESETS['default'];
        }

        $('#vn-mode-theme-css').text(cssToApply);
        $('#vn-theme-select').val(themeKey);
        localStorage.setItem('vnModeTheme', themeKey);
    }

    updateThemeSelect();
    applyTheme(CURRENT_THEME);
    updateToggleButtonState();

    function updateToggleButtonState() {
        const $btn = $('#vn-user-sprite-toggle');
        if (ENABLE_USER_SPRITE) $btn.removeClass('off').addClass('on').text('🧑 User Img: ON');
        else $btn.removeClass('on').addClass('off').text('🧑 User Img: OFF');
    }

    function toggleVNMode() {
        isVnModeOn = !isVnModeOn;
        const btn = $('#vn-toggle-btn');
        if (isVnModeOn) {
            btn.addClass('active');
            $('body').addClass('vn-mode-active');
            checkLastMessage(); 
            $('#vn-overlay').fadeIn(200);
        } else {
            btn.removeClass('active');
            $('body').removeClass('vn-mode-active');
            $('#vn-overlay').fadeOut(200);
            if (typingTimer) clearTimeout(typingTimer);
            isTyping = false;
        }
    }

    // -------------------------------------------------------
    // [4] 이벤트 리스너
    // -------------------------------------------------------

    $('#vn-overlay').on('change', '#vn-theme-select', function() {
        applyTheme($(this).val());
    });

    // [저장 버튼]
    $('#vn-overlay').on('click', '#vn-save-custom-btn', function(e) {
        const name = $('#vn-new-preset-name').val().trim();
        const css = $('#vn-custom-css-input').val();
        if (!name) { alert("Please enter a theme name."); return; }
        if (['default', 'dark', 'modern', 'custom_draft'].includes(name)) { alert("Reserved name."); return; }
        customThemes[name] = css;
        localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes));
        updateThemeSelect();
        applyTheme(name);
        if(window.toastr) toastr.success(`Theme "${name}" Saved!`);
    });

    // [삭제 버튼]
    $('#vn-overlay').on('click', '#vn-delete-custom-btn', function() {
        const name = $('#vn-new-preset-name').val().trim();
        if (!customThemes[name]) return;
        if (confirm(`Delete theme "${name}"?`)) {
            delete customThemes[name];
            localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes));
            updateThemeSelect();
            applyTheme('default');
            if(window.toastr) toastr.info(`Theme Deleted.`);
        }
    });

    // [적용 버튼]
    $('#vn-overlay').on('click', '#vn-apply-btn', function() {
        const currentVal = $('#vn-theme-select').val();
        
        // 1. 기본 테마일 경우
        if (DEFAULT_PRESETS[currentVal]) {
             $('#vn-mode-theme-css').text(DEFAULT_PRESETS[currentVal]);
             if(window.toastr) toastr.success(`Preset "${currentVal}" Applied!`);
             $('#vn-preset-panel').hide();
             return; 
        }

        // 2. 커스텀/Draft일 경우
        const css = $('#vn-custom-css-input').val();
        if (currentVal === 'custom_draft') {
            SAVED_CUSTOM_CSS_DRAFT = css;
            localStorage.setItem('vnModeCustomCSS', css);
        } 
        else if (customThemes[currentVal]) {
            customThemes[currentVal] = css;
            localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes));
        }
        $('#vn-mode-theme-css').text(css);
        if(window.toastr) toastr.success('Custom CSS Applied!');
        $('#vn-preset-panel').hide();
    });

    // ★ [Export] 내보내기 버튼 로직
    $('#vn-overlay').on('click', '#vn-export-btn', function() {
        const themeData = localStorage.getItem('vnModeCustomThemes');
        if (!themeData || themeData === '{}') {
            if(window.toastr) toastr.warning("No custom themes to export.");
            else alert("No custom themes to export.");
            return;
        }
        
        const blob = new Blob([themeData], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vn_mode_themes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if(window.toastr) toastr.success("Custom Themes Exported!");
    });

    // ★ [Import] 불러오기 버튼 로직
    $('#vn-overlay').on('click', '#vn-import-btn', function() {
        $('#vn-import-input').click();
    });

    $('#vn-overlay').on('change', '#vn-import-input', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedThemes = JSON.parse(e.target.result);
                if (typeof importedThemes !== 'object') throw new Error("Invalid JSON");
                
                // 기존 테마와 병합 (Merge)
                customThemes = { ...customThemes, ...importedThemes };
                localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes));
                
                updateThemeSelect(); // 리스트 갱신
                
                if(window.toastr) toastr.success(`Imported ${Object.keys(importedThemes).length} themes!`);
                else alert("Themes Imported Successfully!");
                
            } catch (err) {
                console.error(err);
                if(window.toastr) toastr.error("Failed to import: Invalid JSON file.");
                else alert("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
        $(this).val(''); // 같은 파일 다시 선택 가능하도록 초기화
    });

    $('#vn-overlay').on('click', '#vn-preset-toggle-btn', function(e) { e.stopPropagation(); $('#vn-preset-panel').toggle(); });
    $('#vn-overlay').on('click', '#vn-preset-panel', function(e) { e.stopPropagation(); });

    // -------------------------------------------------------
    // [5] VN 모드 핵심 로직 (기존 동일)
    // -------------------------------------------------------
    function openVN(dataArray) {
        if (!isVnModeOn) return;
        $('#vn-input-area').hide();
        $('#vn-text-content').show();
        $('#vn-indicator').show();
        vnParagraphs = (dataArray && dataArray.length > 0) ? dataArray : [{ text: "...", img: null, bg: null }];
        vnStep = 0;
        renderText();
    }

    function renderText() {
        const currentData = vnParagraphs[vnStep];
        if (currentData.bg) changeBackground(currentData.bg);
        if (currentData.img) changeSprite(currentData.img);
        typeText(currentData.text);
    }

    function changeBackground(src) {
        if (currentBgSrc === src) return;
        currentBgSrc = src;
        $('#vn-background-layer').css('background-image', `url('${src}')`);
    }

    function typeText(text) {
        const $content = $('#vn-text-content');
        $content.text('');
        currentFullText = text;
        isTyping = true;
        $('#vn-indicator').hide();
        if (typingTimer) clearTimeout(typingTimer);
        let i = 0;
        function typeNext() {
            if (i < text.length) {
                $content.text(text.substring(0, i + 1));
                i++;
                typingTimer = setTimeout(typeNext, TYPE_SPEED);
            } else {
                isTyping = false;
                $('#vn-indicator').show();
            }
        }
        typeNext();
    }

    function changeSprite(src) {
        if (src.toLowerCase().includes('background-')) return;
        const filename = src.substring(src.lastIndexOf('/') + 1).toLowerCase();
        const isUser = filename.startsWith('user');
        if (!ENABLE_USER_SPRITE && isUser) return;
        let activeClass = (!ENABLE_USER_SPRITE) ? 'center-pos' : (isUser ? 'right-pos' : 'left-pos');
        let inactiveClass = (!ENABLE_USER_SPRITE) ? 'center-pos' : (isUser ? 'left-pos' : 'right-pos');
        if ((!ENABLE_USER_SPRITE || !isUser)) { if (currentLeftSrc === src && currentLeftSrc !== "") return; currentLeftSrc = src; }
        if (ENABLE_USER_SPRITE && isUser) { if (currentRightSrc === src && currentRightSrc !== "") return; currentRightSrc = src; }
        const $layer = $('#vn-sprite-layer');
        if (ENABLE_USER_SPRITE) $layer.find(`.vn-character-sprite.${inactiveClass}`).addClass('dimmed').css('z-index', 5);
        else $layer.find(`.vn-character-sprite`).removeClass('dimmed').css('z-index', 15);
        const $oldActive = $layer.find(`.vn-character-sprite.${activeClass}`).not('.exiting');
        $oldActive.addClass('exiting');
        const $newImg = $('<img>', { src: src, class: `vn-character-sprite ${activeClass}`, css: { zIndex: 15 } });
        $layer.append($newImg);
        setTimeout(() => { $oldActive.remove(); }, 600);
    }

    function sendUserMessage() {
        const inputVal = $('#vn-user-input').val();
        const trimmedInput = inputVal.trim();
        const stInput = $('#send_textarea');
        stInput.val(inputVal);
        stInput[0].dispatchEvent(new Event('input', { bubbles: true }));
        $('#send_but').click();
        $('#vn-user-input').val('');
        $('#vn-input-area').hide();
        $('#vn-indicator').hide();
        $('#vn-text-content').show();
        if (trimmedInput.length > 0) { lastUserPrompt = trimmedInput; $('#vn-text-content').text(lastUserPrompt); } 
        else { lastUserPrompt = ""; $('#vn-text-content').text("..."); }
    }

    const checkLastMessage = () => {
        if (!isVnModeOn) return;
        const lastMsgElement = $('#chat').children('.mes').last();
        if (lastMsgElement.length === 0) return;
        const isUser = lastMsgElement.attr('is_user');
        if (isUser === "true" && !ENABLE_USER_SPRITE) { $('#vn-text-content').text("..."); return; }
        const messageContentDiv = lastMsgElement.find('.mes_text');
        let parsedSegments = [];
        let tempActiveImg = null;
        let tempActiveBg = null;
        let targetSource = messageContentDiv;
        const translatedBlock = messageContentDiv.find('.translated_text');
        if (translatedBlock.length > 0) targetSource = translatedBlock;
        targetSource.contents().each(function() {
            const node = $(this);
            let foundImg = null;
            if (node.is('img')) foundImg = node.attr('src');
            else if (node.find('img').length > 0) foundImg = node.find('img').attr('src');
            if (foundImg) {
                if (foundImg.toLowerCase().includes('background-')) tempActiveBg = foundImg;
                else tempActiveImg = foundImg;
            }
            let rawText = node.text();
            if (node.is('style') || node.is('script')) rawText = "";
            if (rawText && rawText.trim().length > 0) {
                const lines = rawText.split(/\n+/).filter(t => t.trim().length > 0);
                lines.forEach(line => {
                    const imgToUse = (!ENABLE_USER_SPRITE && isUser === "true") ? null : tempActiveImg;
                    parsedSegments.push({ text: line.trim(), img: imgToUse, bg: tempActiveBg });
                });
            }
        });
        if (parsedSegments.length > 0) openVN(parsedSegments);
    };

    $('#vn-overlay').on('click', '#vn-trans-btn', function () {
        const $vnInput = $('#vn-user-input');
        const originalText = $vnInput.val().trim();
        if (!originalText) return;
        const $translatorBtn = $('#llm_translate_input_button');
        const $realInput = $('#send_textarea');
        if ($translatorBtn.length === 0) return;
        const $vnTransBtn = $(this);
        const originalBtnContent = $vnTransBtn.html();
        $vnTransBtn.prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i>');
        $vnInput.prop('disabled', true);
        $realInput.val(originalText);
        const textBeforeTranslation = $realInput.val();
        $translatorBtn.click();
        let checks = 0;
        const pollInterval = setInterval(() => {
            checks++;
            const currentRealText = $realInput.val();
            if (currentRealText !== textBeforeTranslation && currentRealText.trim() !== "") {
                clearInterval(pollInterval);
                $vnInput.val(currentRealText);
                cleanup();
            } else if (checks >= 150) { clearInterval(pollInterval); cleanup(); }
        }, 100);
        function cleanup() { $vnTransBtn.prop('disabled', false).html(originalBtnContent); $vnInput.prop('disabled', false).focus(); }
    });

    $('#vn-overlay').on('click', '#vn-user-sprite-toggle', function(e) {
        e.stopPropagation();
        ENABLE_USER_SPRITE = !ENABLE_USER_SPRITE;
        localStorage.setItem('vnModeUserSprite', ENABLE_USER_SPRITE);
        updateToggleButtonState();
        $('#vn-sprite-layer').empty();
        currentLeftSrc = ""; currentRightSrc = "";
        setTimeout(checkLastMessage, 100);
    });

    $(document).on('click', '#vn-toggle-btn', toggleVNMode);
    $('#vn-overlay').on('click', function (e) {
        if ($(e.target).closest('#vn-input-area, #vn-settings-area, #vn-close-btn, #vn-preset-container').length > 0) return;
        if (lastUserPrompt !== "" || $('#vn-text-content').text() === "...") return;
        if (isTyping) {
            clearTimeout(typingTimer);
            $('#vn-text-content').text(currentFullText);
            isTyping = false;
            $('#vn-indicator').show();
            return;
        }
        vnStep++;
        if (vnStep < vnParagraphs.length) { renderText(); } 
        else { $('#vn-text-content').hide(); $('#vn-indicator').hide(); $('#vn-input-area').css('display', 'flex'); $('#vn-user-input').focus(); }
    });

    $('#vn-send-btn').on('click', sendUserMessage);
    $('#vn-user-input').on('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUserMessage(); }});
    $('#vn-close-btn').on('click', function (e) { e.stopPropagation(); if(isVnModeOn) toggleVNMode(); });

    const generationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && mutation.attributeName === "data-generating") {
                const isGenerating = document.body.getAttribute("data-generating");
                if (isGenerating === "true" && isVnModeOn) {
                    $('#vn-input-area').hide(); $('#vn-text-content').show(); $('#vn-indicator').hide();
                    if (lastUserPrompt) $('#vn-text-content').text(lastUserPrompt); else $('#vn-text-content').text("...");
                }
                if (!isGenerating || isGenerating === "false") { lastUserPrompt = ""; setTimeout(checkLastMessage, 200); }
            }
        });
    });
    generationObserver.observe(document.body, { attributes: true, attributeFilter: ["data-generating"] });

    const translationObserver = new MutationObserver((mutations) => {
        if (!isVnModeOn) return;
        if (window.vnTranslationDebounce) clearTimeout(window.vnTranslationDebounce);
        window.vnTranslationDebounce = setTimeout(() => checkLastMessage(), 300);
    });
    translationObserver.observe(document.getElementById('chat'), { childList: true, subtree: true, characterData: true });

    console.log("[VN Mode] v4.5 Logic Loaded.");
});