// VN Mode Script v5.9.0 - Draggable Button & Custom Icon Support
jQuery(document).ready(function () {
    console.log("[VN Mode] Loading Extension v5.9.0 (Draggable Button)...");

    // [상태 변수]
    let isVnModeOn = false;
    let vnParagraphs = [];
    let vnStep = 0;
    let lastUserPrompt = "";
    
    // 설정 불러오기
    let ENABLE_USER_SPRITE = localStorage.getItem('vnModeUserSprite') === 'false' ? false : true;
    let ENABLE_PORTRAIT_MODE = localStorage.getItem('vnModePortrait') === 'true';

    let SAVED_CUSTOM_CSS_DRAFT = localStorage.getItem('vnModeCustomCSS') || ''; 
    let customThemes = JSON.parse(localStorage.getItem('vnModeCustomThemes') || '{}');
    let CURRENT_THEME = localStorage.getItem('vnModeTheme') || 'default';
    let CURRENT_FONT_SIZE = parseFloat(localStorage.getItem('vnModeFontSize')) || 1.7;

    // ★ [New] 버튼 커스텀 설정 변수
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
                <ul id="vn-bgm-list">
                    <li style="color:#aaa; text-align:center; padding:20px;">No music added.</li>
                </ul>
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
                        <label style="font-size:0.8em; color:#555;">Icon URL (Empty = Default)</label>
                        <input type="text" id="vn-btn-icon-input" placeholder="http://... (Image URL)" style="width:100%; margin-bottom:5px; padding:4px; border:1px solid #ccc; border-radius:4px;">
                        
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
                <div id="vn-name-label">Talk</div> <div id="vn-portrait-box">
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
        <style> /* 기존 스타일 유지 (CSS 파일에서 제어) */ </style>
    `;

    // -------------------------------------------------------
    // [UI 생성 및 버튼 초기화]
    // -------------------------------------------------------
    if ($('#vn-overlay').length === 0) { $('body').append(htmlTemplate); }
    if ($('#vn-mode-theme-css').length === 0) { $('<style id="vn-mode-theme-css">').appendTo('head'); }

    // ★ [New] 버튼 생성 (body에 직접 추가하여 자유롭게 이동)
    if ($('#vn-toggle-btn').length === 0) {
        // 기존 top-bar에 있는 버튼 제거 (업데이트 충돌 방지)
        $('#top-bar').find('#vn-toggle-btn').remove();
        $('body').append(`<div id="vn-toggle-btn" title="VN Mode ON/OFF (Drag to move)"></div>`);
    }

    // -------------------------------------------------------
    // [New] 버튼 스타일 및 드래그 로직
    // -------------------------------------------------------
// [수정됨] 이미지 모양 그대로 나오게 (강제 적용)
    function applyBtnStyle() {
        const $btn = $('#vn-toggle-btn');
        const fontSize = BTN_SIZE * 0.5; 

        // 1. 기본 크기/위치 설정
        $btn.css({
            'left': BTN_POS_X + 'px',
            'top': BTN_POS_Y + 'px',
            'width': BTN_SIZE + 'px',
            'height': BTN_SIZE + 'px',
            'min-width': BTN_SIZE + 'px',
            'line-height': BTN_SIZE + 'px',
            'font-size': fontSize + 'px'
        });

        // 2. 이미지 유무에 따른 스타일
        if (BTN_ICON_URL && BTN_ICON_URL.trim() !== "") {
            // ★ 이미지가 있을 때: 네모/투명/원본비율
            $btn.removeClass('fa-solid fa-book');
            $btn.text(""); 
            
            $btn.css({
                'background-image': `url('${BTN_ICON_URL}')`,
                'background-size': 'contain', /* 이미지 비율 유지하며 꽉 차게 */
                'background-repeat': 'no-repeat',
                'background-position': 'center',
                
                'background-color': 'transparent', 
                'border': 'none',
                
                // ★ 중요: 둥글게 깎는 속성을 0으로 강제 설정
                'border-radius': '0', 
                'box-shadow': 'none'
            });
            
        } else {
            // ★ 이미지가 없을 때: 기본 둥근 버튼
            $btn.css('background-image', 'none');
            $btn.addClass('fa-solid fa-book');
            
            $btn.css({
                'background-color': 'rgba(30, 30, 30, 0.8)',
                'border': '1px solid #444',
                'border-radius': '50%', /* 다시 동그랗게 */
                'box-shadow': '' 
            });
        }

        // 설정값 동기화
        $('#vn-btn-icon-input').val(BTN_ICON_URL);
        $('#vn-btn-size-slider').val(BTN_SIZE);
        $('#vn-btn-size-val').text(BTN_SIZE + 'px');
    }

// [최종 수정] 모바일 렉 제거(최적화) + 위치 저장 버그 수정
    function makeButtonDraggable() {
        const btn = document.getElementById('vn-toggle-btn');
        const $btn = $(btn);

        // 기존 이벤트 제거 (중복 방지)
        $btn.off('click'); 
        $(document).off('click', '#vn-toggle-btn');
        $(document).off('mousedown', '#vn-toggle-btn');
        $(document).off('touchstart', '#vn-toggle-btn');

        // 상태 변수
        let isDragging = false;
        let hasMoved = false;
        
        // 좌표 계산 변수
        let startX, startY;       // 터치 시작 지점
        let initialLeft, initialTop; // 버튼의 원래 위치
        
        // 애니메이션 최적화 변수 (렉 방지)
        let rafId = null; 
        let currentX, currentY;

        // [1] 드래그 시작
        function onStart(x, y) {
            isDragging = true;
            hasMoved = false;
            startX = x;
            startY = y;
            
            // 현재 버튼의 실제 화면상 위치 가져오기
            const rect = btn.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            // 부드러운 이동을 위해 트랜지션 끄기
            btn.style.transition = 'none';
            btn.style.cursor = 'grabbing';
        }

        // [2] 화면 그리기 (requestAnimationFrame 사용 - 렉 해결 핵심)
        function updatePosition() {
            if (!isDragging) return;

            const dx = currentX - startX;
            const dy = currentY - startY;

            // 5픽셀 이상 움직였을 때만 드래그로 간주
            if (!hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                hasMoved = true;
            }

            // 새 위치 계산
            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            // 화면 밖으로 나가지 않게 제한
            const maxLeft = window.innerWidth - btn.offsetWidth;
            const maxTop = window.innerHeight - btn.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            // 스타일 적용
            btn.style.left = newLeft + 'px';
            btn.style.top = newTop + 'px';

            // 다음 프레임 요청
            rafId = requestAnimationFrame(updatePosition);
        }

        // [3] 이동 이벤트 핸들러
        function onMove(x, y) {
            if (!isDragging) return;
            currentX = x;
            currentY = y;
            
            // 이미 애니메이션 프레임이 돌고 있지 않을 때만 실행 (과부하 방지)
            if (!rafId) {
                rafId = requestAnimationFrame(updatePosition);
            }
        }

        // [4] 드래그 종료 (저장 로직)
        function onEnd() {
            if (!isDragging) return;
            isDragging = false;
            
            // 애니메이션 루프 정지
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            btn.style.cursor = 'grab';
            btn.style.transition = 'transform 0.1s, box-shadow 0.2s'; // 애니메이션 복구

            // ★ 위치 저장 (이게 안 돼서 초기화됐던 것)
            const finalRect = btn.getBoundingClientRect();
            BTN_POS_X = parseInt(finalRect.left);
            BTN_POS_Y = parseInt(finalRect.top);
            
            localStorage.setItem('vnModeBtnX', BTN_POS_X);
            localStorage.setItem('vnModeBtnY', BTN_POS_Y);
        }

        // ============================
        // 이벤트 리스너 등록
        // ============================

        // PC 마우스
        btn.onmousedown = function(e) {
            if (e.button !== 0) return;
            e.preventDefault();
            onStart(e.clientX, e.clientY);

            document.onmousemove = function(e) {
                e.preventDefault();
                onMove(e.clientX, e.clientY);
            };

            document.onmouseup = function() {
                onEnd();
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };

        // 모바일 터치 (passive: false로 스크롤 방지하여 렉 줄임)
        btn.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) return;
            const touch = e.touches[0];
            onStart(touch.clientX, touch.clientY);
        }, { passive: false });

        btn.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            // 드래그 중 화면 스크롤되는 것 막기 (렉 원인 1순위 제거)
            if (e.cancelable) e.preventDefault(); 
            
            const touch = e.touches[0];
            onMove(touch.clientX, touch.clientY);
        }, { passive: false });

        btn.addEventListener('touchend', function(e) {
            onEnd();
        });

        // 클릭 실행 로직
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            // 움직이지 않았을 때만 실행 (클릭)
            if (!hasMoved) {
                toggleVNMode();
            }
        };

        // 화면 회전/리사이즈 시 위치 보정
        window.addEventListener('resize', function() {
            const rect = btn.getBoundingClientRect();
            if (rect.right > window.innerWidth) btn.style.left = (window.innerWidth - rect.width - 10) + 'px';
            if (rect.bottom > window.innerHeight) btn.style.top = (window.innerHeight - rect.height - 10) + 'px';
        });
    }


    // -------------------------------------------------------
    // [기본 로직 함수들]
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

    updateThemeSelect(); applyTheme(CURRENT_THEME); applyFontSize(CURRENT_FONT_SIZE);
    updateToggleButtonState(); updatePortraitToggleState();
    
    // ★ 버튼 초기화 실행
    applyBtnStyle();
    makeButtonDraggable();

    function toggleVNMode() {
        isVnModeOn = !isVnModeOn;
        const btn = $('#vn-toggle-btn');
        if (isVnModeOn) {
            btn.addClass('active'); $('body').addClass('vn-mode-active');
            checkLastMessage(); $('#vn-overlay').fadeIn(200); applyFontSize(CURRENT_FONT_SIZE);
        } else {
            btn.removeClass('active'); $('body').removeClass('vn-mode-active');
            $('#vn-overlay').fadeOut(200); if (typingTimer) clearTimeout(typingTimer); isTyping = false;
        }
    }

    // [BGM] 플레이어 로직
    bgmAudio.addEventListener('ended', function() { if (bgmLoopMode === 1) { bgmAudio.currentTime = 0; bgmAudio.play(); } else { playNext(true); } });
    function renderPlaylist() { const $list = $('#vn-bgm-list'); $list.empty(); if (bgmPlaylist.length === 0) { $list.append('<li style="color:#aaa; text-align:center;">No music added.</li>'); return; } bgmPlaylist.forEach((track, index) => { const activeClass = (index === currentBgmIndex) ? 'active' : ''; const icon = (index === currentBgmIndex && isBgmPlaying) ? '<i class="fa-solid fa-volume-high"></i> ' : '<i class="fa-solid fa-music"></i> '; const $li = $(`<li class="${activeClass}" data-index="${index}"><span class="track-name" style="flex-grow:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${icon}${track.name}</span><button class="vn-bgm-del-btn" title="Remove"><i class="fa-solid fa-xmark"></i></button></li>`); $li.find('.track-name').on('click', function(e) { e.stopPropagation(); playBgm(index); }); $li.find('.vn-bgm-del-btn').on('click', function(e) { e.stopPropagation(); removeTrack(index); }); $li.on('click', function(e) { e.stopPropagation(); }); $list.append($li); }); }
    function updateBgmPresetUI() { const $select = $('#vn-bgm-preset-select'); $select.empty(); $select.append('<option value="">-- Select Preset --</option>'); for (let name in bgmPresets) { const count = bgmPresets[name] ? bgmPresets[name].length : 0; $select.append(new Option(`${name} (${count} tracks)`, name)); } }
    function playBgm(index) { if (index < 0 || index >= bgmPlaylist.length) return; if (currentBgmIndex === index && !bgmAudio.paused) { bgmAudio.pause(); isBgmPlaying = false; } else { if (currentBgmIndex !== index) { bgmAudio.src = bgmPlaylist[index].url; currentBgmIndex = index; } bgmAudio.play().catch(e => console.error(e)); isBgmPlaying = true; } updateBgmUI(); }
    function playNext(isAuto = false) { if (bgmPlaylist.length === 0) return; if (bgmLoopMode === 2 && isAuto && currentBgmIndex === bgmPlaylist.length - 1 && !bgmShuffle) { stopBgm(); return; } let nextIndex; if (bgmShuffle) { if (bgmPlaylist.length > 1) { do { nextIndex = Math.floor(Math.random() * bgmPlaylist.length); } while (nextIndex === currentBgmIndex); } else { nextIndex = 0; } } else { nextIndex = currentBgmIndex + 1; if (nextIndex >= bgmPlaylist.length) nextIndex = 0; } bgmAudio.src = bgmPlaylist[nextIndex].url; currentBgmIndex = nextIndex; bgmAudio.play(); isBgmPlaying = true; updateBgmUI(); }
    function playPrev() { if (bgmPlaylist.length === 0) return; let prevIndex = currentBgmIndex - 1; if (prevIndex < 0) prevIndex = bgmPlaylist.length - 1; bgmAudio.src = bgmPlaylist[prevIndex].url; currentBgmIndex = prevIndex; bgmAudio.play(); isBgmPlaying = true; updateBgmUI(); }
    function stopBgm() { bgmAudio.pause(); isBgmPlaying = false; updateBgmUI(); }
    function updateBgmUI() { const $btnIcon = $('#vn-bgm-play-pause i'); const $toggleBtn = $('#vn-bgm-toggle-btn'); if (isBgmPlaying && !bgmAudio.paused) { $btnIcon.removeClass('fa-play').addClass('fa-pause'); $toggleBtn.addClass('playing'); } else { $btnIcon.removeClass('fa-pause').addClass('fa-play'); $toggleBtn.removeClass('playing'); } const $shuffleBtn = $('#vn-bgm-shuffle'); if (bgmShuffle) $shuffleBtn.addClass('active'); else $shuffleBtn.removeClass('active'); const $loopBtn = $('#vn-bgm-loop'); $loopBtn.empty(); if (bgmLoopMode === 0) { $loopBtn.removeClass('active').html('<i class="fa-solid fa-repeat"></i>'); bgmAudio.loop = false; } else if (bgmLoopMode === 1) { $loopBtn.addClass('active').html('<i class="fa-solid fa-repeat"></i><span style="font-size:0.6em; position:absolute;">1</span>'); bgmAudio.loop = true; } else { $loopBtn.removeClass('active').html('<i class="fa-solid fa-arrow-right-long"></i>'); bgmAudio.loop = false; } renderPlaylist(); }
    function removeTrack(index) { if (confirm("Remove this track?")) { if (currentBgmIndex === index) stopBgm(); bgmPlaylist.splice(index, 1); localStorage.setItem('vnModeBgmPlaylist', JSON.stringify(bgmPlaylist)); if (currentBgmIndex > index) currentBgmIndex--; renderPlaylist(); } }
    renderPlaylist(); updateBgmUI(); updateBgmPresetUI(); 

    // -------------------------------------------------------
    // [4] 이벤트 리스너
    // -------------------------------------------------------
    function stopProp(e) { e.stopPropagation(); }
    
    // ★ [New] 버튼 설정 이벤트
    $('#vn-overlay').on('change input', '#vn-btn-icon-input', function(e) {
        BTN_ICON_URL = $(this).val();
        localStorage.setItem('vnModeBtnIcon', BTN_ICON_URL);
        applyBtnStyle();
    });
    $('#vn-overlay').on('input', '#vn-btn-size-slider', function(e) {
        BTN_SIZE = $(this).val();
        localStorage.setItem('vnModeBtnSize', BTN_SIZE);
        applyBtnStyle();
    });

    // 기존 이벤트
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

    // ★ [중요] 토글 버튼 클릭 (드래그와 클릭 구분)
    let isClickAction = true;
    $(document).on('mousedown', '#vn-toggle-btn', function() { isClickAction = true; });
    $(document).on('mousemove', '#vn-toggle-btn', function() { isClickAction = false; }); 
    $(document).on('click', '#vn-toggle-btn', function(e) { 
        if (isClickAction) toggleVNMode(); 
    });

    // -------------------------------------------------------
    // [5] 메인 로직
    // -------------------------------------------------------
    function openVN(dataArray) {
        if (!isVnModeOn) return;
        $('#vn-input-area').hide(); 
        $('#vn-text-content').show(); 
        $('#vn-indicator').show();
        $('#vn-choice-area').empty().hide();

        vnParagraphs = (dataArray && dataArray.length > 0) ? dataArray : [{ text: "...", img: null, bg: null }];
        vnStep = 0; 
        renderText();
    }

    function renderText() {
        if (vnStep >= vnParagraphs.length) return; 

        const currentData = vnParagraphs[vnStep];
        
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
            playSceneVideo(currentData.video, function() {
                currentData.video = null; 
                renderText(); 
            });
            return; 
        }

        const hasChoices = currentData.choices && currentData.choices.length > 0;
        if ((!currentData.text || currentData.text.trim() === "") && !hasChoices) {
            console.log("[VN Mode] Empty line. Skipping...");
            vnStep++; 
            if (vnStep < vnParagraphs.length) { setTimeout(renderText, 10); } 
            else { finishStory(); }
            return; 
        }

        $('#vn-choice-area').empty().hide(); 
        typeText(currentData.text, currentData.choices);
    }

    function playSceneVideo(url, callback) {
        const $layer = $('#vn-video-layer');
        const $video = $('#vn-scene-video');
        const videoEl = $video[0];

        $video.attr('src', url);
        $layer.css('display', 'block'); 
        
        videoEl.play().catch(e => {
            console.error("Play error:", e);
            closeVideo();
        });

        $('#vn-video-skip').off('click').one('click', function(e) {
            e.stopPropagation();
            closeVideo();
        });

        videoEl.onended = function() {
            closeVideo();
        };

        function closeVideo() {
            videoEl.onended = null;
            videoEl.pause();
            $video.attr('src', ''); 
            $layer.css('display', 'none'); 
            if (callback) callback();
        }
    }

    function finishStory() {
        $('#vn-text-content').hide(); 
        $('#vn-indicator').hide(); 
        $('#vn-input-area').css('display', 'flex'); 
        $('#vn-user-input').focus();
    }

    function changeBackground(src) {
        if (currentBgSrc === src) return;
        currentBgSrc = src; $('#vn-background-layer').css('background-image', `url('${src}')`);
    }

    function typeText(text, choices) {
        const $content = $('#vn-text-content');
        $content.text(''); currentFullText = text; isTyping = true; $('#vn-indicator').hide();
        if (typingTimer) clearTimeout(typingTimer);
        
        let i = 0;
        function typeNext() {
            if (i < text.length) { 
                $content.text(text.substring(0, i + 1)); i++; 
                typingTimer = setTimeout(typeNext, TYPE_SPEED); 
            } else { 
                isTyping = false; 
                if (choices && choices.length > 0) {
                    showChoices(choices);
                    $('#vn-indicator').hide(); 
                } else {
                    $('#vn-indicator').show(); 
                }
            }
        }
        if (!text || text.length === 0) { isTyping = false; if(choices) showChoices(choices); }
        else { typeNext(); }
    }

    function showChoices(choices) {
        const $area = $('#vn-choice-area');
        $area.empty();
        
        choices.forEach(choiceText => {
            const $btn = $('<div class="vn-choice-btn"></div>').text(choiceText);
            $btn.on('click', function(e) {
                e.stopPropagation(); 
                const cleanText = choiceText.replace(/^\s*\d+[\.\)]\s*/, '');
                sendUserMessage(cleanText); 
            });
            $area.append($btn);
        });

        const $directBtn = $('<div class="vn-choice-btn direct-input">✍️ 직접 입력하기</div>');
        $directBtn.on('click', function(e) {
            e.stopPropagation();
            $area.hide(); 
            $('#vn-text-content').hide(); 
            $('#vn-indicator').hide(); 
            $('#vn-input-area').css('display', 'flex'); 
            $('#vn-user-input').focus(); 
        });
        $area.append($directBtn);

        $area.css('display', 'flex'); 
    }

    function changeSprite(src) {
        if (!src || src.toLowerCase().includes('background-') || src.toLowerCase().includes('bg-')) return;
        updateNameLabel(src);
        const filename = src.substring(src.lastIndexOf('/') + 1).toLowerCase();
        const isUser = filename.startsWith('user') || filename.includes('avatar');
        if (!ENABLE_USER_SPRITE && isUser) return;

        if (ENABLE_PORTRAIT_MODE) {
            const $portraitImg = $('#vn-portrait-img');
            const $dialog = $('#vn-dialog-box');
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
        if (!inputVal) {
            inputVal = $('#vn-user-input').val();
        }
        const trimmedInput = inputVal.trim();
        
        const stInput = $('#send_textarea'); 
        stInput.val(inputVal); 
        stInput[0].dispatchEvent(new Event('input', { bubbles: true }));
        
        $('#send_but').click(); 
        
        $('#vn-user-input').val(''); 
        $('#vn-input-area').hide(); 
        $('#vn-choice-area').hide(); 
        $('#vn-indicator').hide(); 
        $('#vn-text-content').show();

        if (trimmedInput.length > 0) { 
            lastUserPrompt = trimmedInput; 
            $('#vn-text-content').text(lastUserPrompt); 
        } else { 
            lastUserPrompt = ""; 
            $('#vn-text-content').text("..."); 
        }
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
                if (foundImg.toLowerCase().includes('background-') || foundImg.toLowerCase().includes('bg-')) {
                    tempActiveBg = foundImg; 
                } else { 
                    tempActiveImg = foundImg; 
                }
            }

            let rawText = node.text(); 
            if (node.is('style') || node.is('script')) rawText = "";

            if (rawText && rawText.trim().length > 0) {
                let extractedChoices = null;
                const choiceMatch = rawText.match(/\{\{choices:\s*([\s\S]*?)\}\}/i);
                
                if (choiceMatch) {
                    let choiceContent = choiceMatch[1];
                    choiceContent = choiceContent.replace(/\n/g, ' ');
                    extractedChoices = choiceContent.split(/(?=\b\d+\.)/).map(s => s.trim()).filter(s => s.length > 0);
                    rawText = rawText.replace(/\{\{choices:[\s\S]*?\}\}/i, "");
                }

                const lines = rawText.split(/\n+/).filter(t => t.trim().length > 0);
                
                if (lines.length === 0 && extractedChoices) {
                    const imgToUse = (!ENABLE_USER_SPRITE && isUser === "true") ? null : tempActiveImg;
                    parsedSegments.push({ text: "", img: imgToUse, bg: tempActiveBg, bgm: null, choices: extractedChoices });
                } else {
                    lines.forEach((line, idx) => {
                        let lineText = line; 
                        let lineBgm = null;
                        let lineVideo = null; 
                        
                        if (/\[\[bgm-stop\]\]/i.test(lineText)) { lineBgm = { type: 'stop' }; lineText = lineText.replace(/\[\[bgm-stop\]\]/gi, ""); }
                        const startMatch = lineText.match(/\[\[bgm-start\s*:\s*(.*?)\s*\]\]/i);
                        if (startMatch) { lineBgm = { type: 'play', name: startMatch[1].trim() }; lineText = lineText.replace(/\[\[bgm-start\s*:\s*(.*?)\s*\]\]/gi, ""); }

                        const videoMatch = lineText.match(/\{\{scene-m\s*:\s*(.*?)\}\}/i);
                        if (videoMatch) {
                            lineVideo = videoMatch[1].trim();
                            lineText = lineText.replace(/\{\{scene-m\s*:\s*(.*?)\}\}/gi, "");
                        }

                        const imgToUse = (!ENABLE_USER_SPRITE && isUser === "true") ? null : tempActiveImg;
                        const myChoices = (idx === lines.length - 1) ? extractedChoices : null;

                        parsedSegments.push({ 
                            text: lineText.trim(), 
                            img: imgToUse, 
                            bg: tempActiveBg,
                            bgm: lineBgm,
                            video: lineVideo, 
                            choices: myChoices 
                        });
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
    $('#vn-overlay').on('click', function (e) {
        if ($(e.target).closest('#vn-input-area, #vn-settings-area, #vn-bgm-panel, #vn-close-btn, #vn-preset-container, .vn-choice-btn, #vn-video-layer').length > 0) return;
        if (lastUserPrompt !== "" || $('#vn-text-content').text() === "...") return;
        if ($('#vn-video-layer').css('display') !== 'none') return;

        if (isTyping) { 
            clearTimeout(typingTimer); 
            $('#vn-text-content').text(currentFullText); 
            isTyping = false; 
            
            const currentChoices = vnParagraphs[vnStep] ? vnParagraphs[vnStep].choices : null;
            if (currentChoices && currentChoices.length > 0) {
                showChoices(currentChoices);
                $('#vn-indicator').hide();
            } else {
                $('#vn-indicator').show();
            }
            return; 
        }

        if ($('#vn-choice-area').css('display') !== 'none') return;

        vnStep++; 
        if (vnStep < vnParagraphs.length) { renderText(); } 
        else { finishStory(); }
    });
    $('#vn-send-btn').on('click', function(e) { stopProp(e); sendUserMessage(); });
    $('#vn-user-input').on('keydown', function (e) { stopProp(e); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUserMessage(); } });
    $('#vn-close-btn').on('click', function (e) { stopProp(e); if(isVnModeOn) toggleVNMode(); });
    const generationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && mutation.attributeName === "data-generating") {
                const isGenerating = document.body.getAttribute("data-generating");
                if (isGenerating === "true" && isVnModeOn) { 
                    $('#vn-input-area').hide(); 
                    $('#vn-choice-area').hide();
                    $('#vn-text-content').show(); 
                    $('#vn-indicator').hide(); 
                    if (lastUserPrompt) $('#vn-text-content').text(lastUserPrompt); else $('#vn-text-content').text("..."); 
                }
                if (!isGenerating || isGenerating === "false") { lastUserPrompt = ""; setTimeout(checkLastMessage, 200); }
            }
        });
    });
    generationObserver.observe(document.body, { attributes: true, attributeFilter: ["data-generating"] });
    const translationObserver = new MutationObserver((mutations) => {
        if (!isVnModeOn) return; if (window.vnTranslationDebounce) clearTimeout(window.vnTranslationDebounce);
        window.vnTranslationDebounce = setTimeout(() => checkLastMessage(), 300);
    });
    translationObserver.observe(document.getElementById('chat'), { childList: true, subtree: true, characterData: true });
    console.log("[VN Mode] v5.9.0 Loaded.");
});

// ======================================================
// [VN Mode] Sprite & Dialog Slider Injector
// ======================================================
(function() {
    const DEFAULTS = {
        charScale: 1.0, charX: 0, charY: 0,
        userScale: 1.0, userX: 0, userY: 0,
        portraitSize: 180,
        dialogY: 40, dialogX: 0, dialogW: 95, dialogH: 250
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
            dialogH: localStorage.getItem('vnModeDialogH') || DEFAULTS.dialogH
        };
    }
    const setVar = (name, val, unit='') => document.documentElement.style.setProperty(name, val + unit);
    function applyAllSettings() {
        const s = getSettings();
        setVar('--vn-char-scale', s.charScale); setVar('--vn-char-x', s.charX, 'px'); setVar('--vn-char-y', s.charY, 'px');
        setVar('--vn-user-scale', s.userScale); setVar('--vn-user-x', s.userX, 'px'); setVar('--vn-user-y', s.userY, 'px');
        setVar('--vn-portrait-size', s.portraitSize, 'px');
        setVar('--vn-dialog-y', s.dialogY, 'px'); setVar('--vn-dialog-x', s.dialogX, 'px');
        setVar('--vn-dialog-w', s.dialogW, '%'); setVar('--vn-dialog-h', s.dialogH, 'px');
    }
    applyAllSettings();
    function createSliderHTML(id, label, min, max, step, val, unitSuffix='') {
        return `<div class="vn-slider-container"><div class="vn-slider-header"><span>${label}</span><span class="vn-slider-val" id="${id}-val">${val}${unitSuffix}</span></div><input type="range" id="${id}" class="vn-slider-range" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
    }
    function injectSpriteSliders() {
        const panel = document.getElementById('vn-preset-panel'); if (!panel) return;
        if (document.getElementById('vn-sprite-sliders-area')) return;
        
        const sliderArea = document.createElement('div'); 
        sliderArea.id = 'vn-sprite-sliders-area'; 
        sliderArea.className = 'vn-sprite-settings-group';
        
        const s = getSettings();
        
        // HTML 생성 부분
        let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"><h5 style="margin:0;">🎨 레이아웃 설정</h5><button id="vn-reset-settings-btn" style="background:#607D8B; color:white; border:none; border-radius:4px; padding:3px 8px; font-size:0.75em; cursor:pointer;">🔄 초기화</button></div>`;
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
                ['vnModeCharScale', 'vnModeCharX', 'vnModeCharY', 'vnModeUserScale', 'vnModeUserX', 'vnModeUserY', 'vnModePortraitSize', 'vnModeDialogY', 'vnModeDialogX', 'vnModeDialogW', 'vnModeDialogH'].forEach(k => localStorage.removeItem(k));
                applyAllSettings(); document.getElementById('vn-sprite-sliders-area').remove(); injectSpriteSliders();
            }
        });
    }
    setInterval(() => { injectSpriteSliders(); const sprites = document.querySelectorAll('.vn-character-sprite'); sprites.forEach(img => { if (img.src && (img.src.includes('user') || img.src.includes('User') || img.src.includes('avatar'))) { if (!img.classList.contains('vn-user-sprite')) img.classList.add('vn-user-sprite'); } }); }, 2000);
})();

 