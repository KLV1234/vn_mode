// VN Mode Script v4.9 - Added BGM Playlist Presets
jQuery(document).ready(function () {
    console.log("[VN Mode] Loading Extension v4.9 (BGM Presets)...");

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
    let CURRENT_FONT_SIZE = parseFloat(localStorage.getItem('vnModeFontSize')) || 1.7;

    // ★ BGM 관련 변수
    let bgmPlaylist = JSON.parse(localStorage.getItem('vnModeBgmPlaylist') || '[]'); 
    // ★ [신규] BGM 프리셋 저장소
    let bgmPresets = JSON.parse(localStorage.getItem('vnModeBgmPresets') || '{}');

    let bgmAudio = new Audio();
    let isBgmPlaying = false;
    let currentBgmIndex = -1;
    let bgmShuffle = false;
    let bgmLoopMode = 0; 

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
    const DEFAULT_PRESETS = {
        'default': `
#vn-dialog-box { background-color: #fffdf2; background-image: radial-gradient(#f3efd8 20%, transparent 20%); background-size: 20px 20px; border: 4px solid #fff; border-radius: 45px; box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.5) inset, 0 15px 25px rgba(90, 70, 50, 0.15); color: #5e5040; }
#vn-dialog-box::before { content: 'Talk'; background: #ff4d4d; color: #fff; transform: rotate(-3deg); border-radius: 30px; top: -25px; left: 50px; box-shadow: 2px 4px 8px rgba(0,0,0,0.2); }
#vn-text-content { color: #5e5040; font-family: 'Jua', sans-serif; text-shadow: none; }
#vn-user-input { background: #fff4cc; border: 2px solid #f2d06b; color: #5e5040; border-radius: 30px; }
#vn-send-btn { background: #f2a900; border-radius: 25px; color: #fff; }
#vn-indicator { border-top-color: #f2a900; }`,
        'dark': `
#vn-dialog-box { background-color: rgba(20, 20, 25, 0.95); background-image: none; border: 2px solid #00bcd4; border-radius: 10px; box-shadow: 0 0 15px rgba(0, 188, 212, 0.4); color: #e0e0e0; }
#vn-dialog-box::before { content: 'LOG'; background: #00bcd4; color: #000; font-family: monospace; transform: none; border-radius: 4px; top: -15px; left: 20px; font-weight: bold; letter-spacing: 2px; box-shadow: 0 0 10px #00bcd4; }
#vn-text-content { color: #eee; font-family: 'Noto Sans KR', sans-serif; text-shadow: 1px 1px 2px #000; }
#vn-user-input { background: #333; border: 1px solid #555; color: #fff; border-radius: 4px; }
#vn-send-btn { background: #00bcd4; border-radius: 4px; color: #000; font-weight: 900; }
#vn-indicator { border-top-color: #00bcd4; }`,
        'modern': `
#vn-dialog-box { background-color: rgba(255, 255, 255, 0.95); background-image: none; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); color: #333; }
#vn-dialog-box::before { display: none; }
#vn-text-content { color: #333; font-family: 'Noto Serif KR', serif; line-height: 1.8; text-shadow: none; }
#vn-user-input { background: #f5f5f5; border-bottom: 2px solid #333; border-radius: 0; border-top:0; border-left:0; border-right:0; color: #333; }
#vn-send-btn { background: #333; color: #fff; border-radius: 4px; }
#vn-indicator { border-top-color: #333; }`
    };

    // -------------------------------------------------------
    // [1] HTML UI 생성 (프리셋 영역 추가됨)
    // -------------------------------------------------------
    const htmlTemplate = `
        <div id="vn-overlay">
            <div id="vn-background-layer"></div>
            <div id="vn-sprite-layer"></div>
            
            <div id="vn-settings-area">
                <div id="vn-user-sprite-toggle" class="vn-top-btn" title="유저 이미지 ON/OFF"></div>
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
                    <button class="vn-sub-ctrl-btn" id="vn-bgm-prev" title="Prev"><i class="fa-solid fa-backward-step"></i></button>
                    <button class="vn-sub-ctrl-btn" id="vn-bgm-next" title="Next"><i class="fa-solid fa-forward-step"></i></button>
                    <button class="vn-sub-ctrl-btn" id="vn-bgm-shuffle" title="Shuffle"><i class="fa-solid fa-shuffle"></i></button>
                    <button class="vn-sub-ctrl-btn" id="vn-bgm-loop" title="Loop Mode"><i class="fa-solid fa-repeat"></i></button>
                </div>

                <ul id="vn-bgm-list">
                    <li style="color:#aaa; text-align:center; padding:20px;">No music added.</li>
                </ul>
                <div class="vn-bgm-inputs">
                    <input type="text" id="vn-bgm-name-input" placeholder="Track Name">
                    <input type="text" id="vn-bgm-url-input" placeholder="URL (mp3/ogg/wav)">
                    <button id="vn-bgm-add-btn" title="Add Track">+</button>
                </div>

                <div class="vn-bgm-preset-area">
                    <h5><i class="fa-solid fa-list"></i> Playlist Library</h5>
                    <div class="vn-preset-row">
                        <select id="vn-bgm-preset-select">
                            <option value="">-- Select Preset --</option>
                        </select>
                    </div>
                    <div class="vn-preset-row">
                        <button id="vn-bgm-load-preset" class="vn-small-btn btn-load" style="flex:1">Load</button>
                        <button id="vn-bgm-save-preset" class="vn-small-btn btn-save" style="flex:1">Save Current</button>
                        <button id="vn-bgm-del-preset" class="vn-small-btn btn-del" title="Delete Preset"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    
                    <div class="vn-preset-io-row">
                        <button id="vn-bgm-preset-export" class="vn-small-btn btn-exp"><i class="fa-solid fa-download"></i> Export Lib</button>
                        <button id="vn-bgm-preset-import" class="vn-small-btn btn-exp"><i class="fa-solid fa-upload"></i> Import Lib</button>
                        <input type="file" id="vn-bgm-preset-file" accept=".json" style="display:none;">
                    </div>
                </div>
            </div>

            <div id="vn-close-btn" title="Close Mode">X</div>
            
            <div id="vn-preset-container">
                <button id="vn-preset-toggle-btn" title="Theme Settings"><i class="fa-solid fa-palette"></i> Theme</button>
                <div id="vn-preset-panel">
                    <h4>Display Settings</h4>
                    <div class="vn-setting-row" style="margin-bottom: 15px; background: #f9f9f9; padding: 8px; border-radius: 6px; border: 1px solid #eee;">
                        <label style="margin-bottom:5px; font-weight:bold;">Font Size</label>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="range" id="vn-font-size-slider" min="0.8" max="3.5" step="0.1" style="flex-grow: 1; cursor: pointer;">
                            <input type="number" id="vn-font-size-input" min="0.8" max="3.5" step="0.1" style="width: 60px; padding: 3px; border: 1px solid #ddd; text-align: center;">
                        </div>
                    </div>
                    <label>Theme Preset:</label>
                    <select id="vn-theme-select"></select>
                    <div id="vn-custom-css-area">
                        <label>CSS Editor:</label>
                        <textarea id="vn-custom-css-input" placeholder="#vn-dialog-box { background: pink; }"></textarea>
                        <div class="vn-preset-controls" id="vn-preset-controls-box">
                            <input type="text" id="vn-new-preset-name" placeholder="New Theme Name" />
                            <div class="vn-btn-row">
                                <button id="vn-save-custom-btn"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                                <button id="vn-delete-custom-btn" style="display:none;"><i class="fa-solid fa-trash"></i> Del</button>
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

    // 메뉴 버튼
    if ($('#vn-toggle-btn').length === 0) {
        $('#top-bar').append(`<div class="fa-solid fa-book menu_button" id="vn-toggle-btn" title="VN Mode ON/OFF"></div>`);
    }
    
    if ($('#vn-mode-theme-css').length === 0) {
        $('<style id="vn-mode-theme-css">').appendTo('head');
    }

    // -------------------------------------------------------
    // [3] 함수 및 로직
    // -------------------------------------------------------

    function applyFontSize(size) {
        size = parseFloat(size);
        if (isNaN(size)) return;
        $('#vn-text-content').css('font-size', size + 'em');
        $('#vn-font-size-slider').val(size);
        $('#vn-font-size-input').val(size);
        CURRENT_FONT_SIZE = size;
        localStorage.setItem('vnModeFontSize', size);
    }

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
            $textArea.val(cssToApply).prop('readonly', true).css('opacity', '0.7'); 
            $controls.hide(); 
        } 
        else if (customThemes[themeKey]) {
            cssToApply = customThemes[themeKey];
            $customArea.show();
            $textArea.val(cssToApply).prop('readonly', false).css('opacity', '1');
            $nameInput.val(themeKey); 
            $delBtn.show(); $controls.show();
        } 
        else if (themeKey === 'custom_draft') {
            cssToApply = SAVED_CUSTOM_CSS_DRAFT;
            $customArea.show();
            $textArea.val(cssToApply).prop('readonly', false).css('opacity', '1');
            $nameInput.val(''); 
            $delBtn.hide(); $controls.show();
        }
        else { cssToApply = DEFAULT_PRESETS['default']; }

        $('#vn-mode-theme-css').text(cssToApply);
        $('#vn-theme-select').val(themeKey);
        localStorage.setItem('vnModeTheme', themeKey);
    }

    updateThemeSelect();
    applyTheme(CURRENT_THEME);
    applyFontSize(CURRENT_FONT_SIZE);
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
            applyFontSize(CURRENT_FONT_SIZE);
        } else {
            btn.removeClass('active');
            $('body').removeClass('vn-mode-active');
            $('#vn-overlay').fadeOut(200);
            if (typingTimer) clearTimeout(typingTimer);
            isTyping = false;
        }
    }

    // -------------------------------------------------------
    // [BGM] 플레이어 로직 + 프리셋 로직 통합
    // -------------------------------------------------------
    bgmAudio.addEventListener('ended', function() {
        if (bgmLoopMode === 1) { bgmAudio.currentTime = 0; bgmAudio.play(); } 
        else { playNext(true); }
    });

    function renderPlaylist() {
        const $list = $('#vn-bgm-list');
        $list.empty();
        if (bgmPlaylist.length === 0) {
            $list.append('<li style="color:#aaa; justify-content:center;">No music added.</li>');
            return;
        }
        bgmPlaylist.forEach((track, index) => {
            const activeClass = (index === currentBgmIndex) ? 'active' : '';
            const icon = (index === currentBgmIndex && isBgmPlaying) ? '<i class="fa-solid fa-volume-high"></i> ' : '<i class="fa-solid fa-music"></i> ';
            const $li = $(`<li class="${activeClass}" data-index="${index}">
                <span class="track-name" style="flex-grow:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${icon}${track.name}</span>
                <button class="vn-bgm-del-btn" title="Remove"><i class="fa-solid fa-xmark"></i></button>
            </li>`);
            
            $li.find('.track-name').on('click', function(e) { e.stopPropagation(); playBgm(index); });
            $li.find('.vn-bgm-del-btn').on('click', function(e) { e.stopPropagation(); removeTrack(index); });
            $li.on('click', function(e) { e.stopPropagation(); });
            $list.append($li);
        });
    }

    function updateBgmPresetUI() {
        const $select = $('#vn-bgm-preset-select');
        $select.empty();
        $select.append('<option value="">-- Select Preset --</option>');
        for (let name in bgmPresets) {
            const count = bgmPresets[name] ? bgmPresets[name].length : 0;
            $select.append(new Option(`${name} (${count} tracks)`, name));
        }
    }

    function playBgm(index) {
        if (index < 0 || index >= bgmPlaylist.length) return;
        
        if (currentBgmIndex === index && !bgmAudio.paused) {
            bgmAudio.pause(); isBgmPlaying = false;
        } else {
            if (currentBgmIndex !== index) { bgmAudio.src = bgmPlaylist[index].url; currentBgmIndex = index; }
            bgmAudio.play().catch(e => { console.error(e); if(window.toastr) toastr.error("Failed to play audio."); });
            isBgmPlaying = true;
        }
        updateBgmUI();
    }

    function playNext(isAuto = false) {
        if (bgmPlaylist.length === 0) return;
        if (bgmLoopMode === 2 && isAuto && currentBgmIndex === bgmPlaylist.length - 1 && !bgmShuffle) { stopBgm(); return; }

        let nextIndex;
        if (bgmShuffle) {
            if (bgmPlaylist.length > 1) { do { nextIndex = Math.floor(Math.random() * bgmPlaylist.length); } while (nextIndex === currentBgmIndex); } 
            else { nextIndex = 0; }
        } else {
            nextIndex = currentBgmIndex + 1;
            if (nextIndex >= bgmPlaylist.length) nextIndex = 0; 
        }
        
        bgmAudio.src = bgmPlaylist[nextIndex].url;
        currentBgmIndex = nextIndex;
        bgmAudio.play();
        isBgmPlaying = true;
        updateBgmUI();
    }

    function playPrev() {
        if (bgmPlaylist.length === 0) return;
        let prevIndex = currentBgmIndex - 1;
        if (prevIndex < 0) prevIndex = bgmPlaylist.length - 1;
        bgmAudio.src = bgmPlaylist[prevIndex].url;
        currentBgmIndex = prevIndex;
        bgmAudio.play();
        isBgmPlaying = true;
        updateBgmUI();
    }

    function stopBgm() {
        bgmAudio.pause(); isBgmPlaying = false; updateBgmUI();
    }

    function updateBgmUI() {
        const $btnIcon = $('#vn-bgm-play-pause i');
        const $toggleBtn = $('#vn-bgm-toggle-btn');
        
        if (isBgmPlaying && !bgmAudio.paused) { $btnIcon.removeClass('fa-play').addClass('fa-pause'); $toggleBtn.addClass('playing'); } 
        else { $btnIcon.removeClass('fa-pause').addClass('fa-play'); $toggleBtn.removeClass('playing'); }

        const $shuffleBtn = $('#vn-bgm-shuffle');
        if (bgmShuffle) $shuffleBtn.addClass('active'); else $shuffleBtn.removeClass('active');

        const $loopBtn = $('#vn-bgm-loop');
        $loopBtn.empty();
        if (bgmLoopMode === 0) { $loopBtn.removeClass('active').html('<i class="fa-solid fa-repeat"></i>'); bgmAudio.loop = false; } 
        else if (bgmLoopMode === 1) { $loopBtn.addClass('active').html('<i class="fa-solid fa-repeat"></i><span style="font-size:0.6em; position:absolute;">1</span>'); bgmAudio.loop = true; } 
        else { $loopBtn.removeClass('active').html('<i class="fa-solid fa-arrow-right-long"></i>'); bgmAudio.loop = false; }

        renderPlaylist(); 
    }

    function removeTrack(index) {
        if (confirm("Remove this track?")) {
            if (currentBgmIndex === index) stopBgm();
            bgmPlaylist.splice(index, 1);
            localStorage.setItem('vnModeBgmPlaylist', JSON.stringify(bgmPlaylist));
            if (currentBgmIndex > index) currentBgmIndex--; 
            renderPlaylist();
        }
    }
    
    renderPlaylist();
    updateBgmUI();
    updateBgmPresetUI(); // 초기 프리셋 목록 렌더링

    // -------------------------------------------------------
    // [4] 이벤트 리스너
    // -------------------------------------------------------
    
    // 공통: 이벤트 버블링 방지 래퍼
    function stopProp(e) { e.stopPropagation(); }

    $('#vn-overlay').on('click', '#vn-bgm-toggle-btn', function(e) {
        stopProp(e);
        const panel = $('#vn-bgm-panel');
        if (panel.is(':visible')) panel.fadeOut(100); else panel.fadeIn(100);
    });
    $('#vn-overlay').on('click', '#vn-bgm-panel', stopProp);

    // BGM 컨트롤
    $('#vn-overlay').on('click', '#vn-bgm-play-pause', function(e) {
        stopProp(e);
        if (currentBgmIndex === -1 && bgmPlaylist.length > 0) playBgm(0);
        else if (currentBgmIndex !== -1) {
            if (bgmAudio.paused) { bgmAudio.play(); isBgmPlaying = true; }
            else { bgmAudio.pause(); isBgmPlaying = false; }
            updateBgmUI();
        }
    });
    $('#vn-overlay').on('click', '#vn-bgm-prev', function(e) { stopProp(e); playPrev(); });
    $('#vn-overlay').on('click', '#vn-bgm-next', function(e) { stopProp(e); playNext(); });
    $('#vn-overlay').on('click', '#vn-bgm-shuffle', function(e) { stopProp(e); bgmShuffle = !bgmShuffle; updateBgmUI(); });
    $('#vn-overlay').on('click', '#vn-bgm-loop', function(e) { stopProp(e); bgmLoopMode = (bgmLoopMode + 1) % 3; updateBgmUI(); });
    $('#vn-overlay').on('input', '#vn-bgm-volume', function(e) { stopProp(e); bgmAudio.volume = $(this).val(); });
    $('#vn-overlay').on('click', '#vn-bgm-volume', stopProp);

    // 트랙 추가
    $('#vn-overlay').on('click', '#vn-bgm-add-btn', function(e) {
        stopProp(e);
        const name = $('#vn-bgm-name-input').val().trim();
        const url = $('#vn-bgm-url-input').val().trim();
        if (!name || !url) { if(window.toastr) toastr.warning("Enter name and URL."); return; }
        bgmPlaylist.push({ name: name, url: url });
        localStorage.setItem('vnModeBgmPlaylist', JSON.stringify(bgmPlaylist));
        $('#vn-bgm-name-input').val(''); $('#vn-bgm-url-input').val('');
        renderPlaylist();
    });
    $('#vn-overlay').on('click', '.vn-bgm-inputs', stopProp);

    // ★ [신규 기능] 프리셋 버튼 이벤트
    // 1. 프리셋 저장 (현재 리스트를 저장)
    $('#vn-overlay').on('click', '#vn-bgm-save-preset', function(e) {
        stopProp(e);
        if (bgmPlaylist.length === 0) { if(window.toastr) toastr.warning("Playlist is empty."); return; }
        const name = prompt("Enter preset name to save current playlist:");
        if (!name || name.trim() === "") return;
        
        bgmPresets[name] = JSON.parse(JSON.stringify(bgmPlaylist)); // Deep copy
        localStorage.setItem('vnModeBgmPresets', JSON.stringify(bgmPresets));
        updateBgmPresetUI();
        $('#vn-bgm-preset-select').val(name);
        if(window.toastr) toastr.success(`Playlist "${name}" Saved!`);
    });

    // 2. 프리셋 불러오기
    $('#vn-overlay').on('click', '#vn-bgm-load-preset', function(e) {
        stopProp(e);
        const name = $('#vn-bgm-preset-select').val();
        if (!name || !bgmPresets[name]) return;
        
        if (bgmPlaylist.length > 0 && !confirm(`Replace current playlist with "${name}"?`)) return;
        
        // 현재 재생 중지
        stopBgm();
        bgmPlaylist = JSON.parse(JSON.stringify(bgmPresets[name])); // Deep copy
        currentBgmIndex = -1;
        localStorage.setItem('vnModeBgmPlaylist', JSON.stringify(bgmPlaylist));
        renderPlaylist();
        if(window.toastr) toastr.success(`Loaded "${name}"`);
    });

    // 3. 프리셋 삭제
    $('#vn-overlay').on('click', '#vn-bgm-del-preset', function(e) {
        stopProp(e);
        const name = $('#vn-bgm-preset-select').val();
        if (!name || !bgmPresets[name]) return;
        
        if (confirm(`Delete preset "${name}"?`)) {
            delete bgmPresets[name];
            localStorage.setItem('vnModeBgmPresets', JSON.stringify(bgmPresets));
            updateBgmPresetUI();
            if(window.toastr) toastr.info("Preset deleted.");
        }
    });

    // 4. 프리셋 라이브러리 내보내기 (전체)
    $('#vn-overlay').on('click', '#vn-bgm-preset-export', function(e) {
        stopProp(e);
        const blob = new Blob([JSON.stringify(bgmPresets, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vn_bgm_library.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 5. 프리셋 라이브러리 가져오기 (전체)
    $('#vn-overlay').on('click', '#vn-bgm-preset-import', function(e) { stopProp(e); $('#vn-bgm-preset-file').click(); });
    $('#vn-overlay').on('change', '#vn-bgm-preset-file', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const imported = JSON.parse(e.target.result);
                // 유효성 검사 (간단히 객체인지 확인)
                if (typeof imported !== 'object' || Array.isArray(imported)) throw new Error("Invalid format");
                
                if (confirm("Merge with existing presets? (Cancel to Overwrite)")) {
                    // Merge
                    bgmPresets = { ...bgmPresets, ...imported };
                } else {
                    // Overwrite
                    bgmPresets = imported;
                }
                localStorage.setItem('vnModeBgmPresets', JSON.stringify(bgmPresets));
                updateBgmPresetUI();
                if(window.toastr) toastr.success("Preset library updated!");
            } catch (err) {
                if(window.toastr) toastr.error("Invalid JSON file.");
            }
        };
        reader.readAsText(file);
        $(this).val('');
    });

    // (기타 기존 설정창 이벤트 리스너들 유지)
    $('#vn-overlay').on('input', '#vn-font-size-slider', function() { applyFontSize($(this).val()); });
    $('#vn-overlay').on('change keyup', '#vn-font-size-input', function() { applyFontSize($(this).val()); });
    $('#vn-overlay').on('change', '#vn-theme-select', function() { applyTheme($(this).val()); });
    
    // 설정창 버튼들
    $('#vn-overlay').on('click', '#vn-save-custom-btn', function(e) {
        stopProp(e);
        const name = $('#vn-new-preset-name').val().trim();
        const css = $('#vn-custom-css-input').val();
        if (!name) return;
        if (['default', 'dark', 'modern', 'custom_draft'].includes(name)) { alert("Reserved name."); return; }
        customThemes[name] = css;
        localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes));
        updateThemeSelect(); applyTheme(name);
        if(window.toastr) toastr.success(`Theme "${name}" Saved!`);
    });
    
    $('#vn-overlay').on('click', '#vn-delete-custom-btn', function(e) {
        stopProp(e);
        const name = $('#vn-new-preset-name').val().trim();
        if (customThemes[name] && confirm(`Delete theme "${name}"?`)) {
            delete customThemes[name];
            localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes));
            updateThemeSelect(); applyTheme('default');
            if(window.toastr) toastr.info(`Theme Deleted.`);
        }
    });
    
    $('#vn-overlay').on('click', '#vn-apply-btn', function(e) {
        stopProp(e);
        const currentVal = $('#vn-theme-select').val();
        if (DEFAULT_PRESETS[currentVal]) {
             $('#vn-mode-theme-css').text(DEFAULT_PRESETS[currentVal]);
             if(window.toastr) toastr.success(`Preset "${currentVal}" Applied!`);
             $('#vn-preset-panel').hide(); return; 
        }
        const css = $('#vn-custom-css-input').val();
        if (currentVal === 'custom_draft') {
            SAVED_CUSTOM_CSS_DRAFT = css;
            localStorage.setItem('vnModeCustomCSS', css);
        } else if (customThemes[currentVal]) {
            customThemes[currentVal] = css;
            localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes));
        }
        $('#vn-mode-theme-css').text(css);
        if(window.toastr) toastr.success('Custom CSS Applied!');
        $('#vn-preset-panel').hide();
    });

    // 테마 Export/Import (기존 코드)
    $('#vn-overlay').on('click', '#vn-export-btn', function(e) {
        stopProp(e);
        const blob = new Blob([JSON.stringify(customThemes, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vn_mode_themes.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    });
    $('#vn-overlay').on('click', '#vn-import-btn', function(e) { stopProp(e); $('#vn-import-input').click(); });
    $('#vn-overlay').on('change', '#vn-import-input', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const imported = JSON.parse(e.target.result);
                customThemes = Object.assign({}, customThemes, imported);
                localStorage.setItem('vnModeCustomThemes', JSON.stringify(customThemes));
                updateThemeSelect();
                if(window.toastr) toastr.success("Themes Imported!");
            } catch (err) { alert("Invalid JSON."); }
        };
        reader.readAsText(file);
    });

    $('#vn-overlay').on('click', '#vn-preset-toggle-btn', function(e) { stopProp(e); $('#vn-preset-panel').toggle(); });
    $('#vn-overlay').on('click', '#vn-preset-panel', stopProp);
    
    // -------------------------------------------------------
    // [5] 메인 로직 (대화창 클릭 등) - 기존과 동일
    // -------------------------------------------------------
    function openVN(dataArray) {
        if (!isVnModeOn) return;
        $('#vn-input-area').hide(); $('#vn-text-content').show(); $('#vn-indicator').show();
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
        if (!src || src.toLowerCase().includes('background-')) return;
        
        const filename = src.substring(src.lastIndexOf('/') + 1).toLowerCase();
        // 유저 이미지인지 판별 (파일명에 user가 들어가거나, 기존 로직 따름)
        const isUser = filename.startsWith('user'); 

        if (!ENABLE_USER_SPRITE && isUser) return;

        // 1. 위치 및 클래스 정의
        let activeClass = (!ENABLE_USER_SPRITE) ? 'center-pos' : (isUser ? 'right-pos' : 'left-pos');
        let inactiveClass = (!ENABLE_USER_SPRITE) ? 'center-pos' : (isUser ? 'left-pos' : 'right-pos');

        const $layer = $('#vn-sprite-layer');

        // ============================================================
        // [수정 핵심] 이미지 교체 여부와 상관없이 밝기(Dimming) 처리를 먼저 수행
        // ============================================================
        if (ENABLE_USER_SPRITE) {
            // 말하고 있는 쪽(Active): 밝게 처리
            $layer.find(`.vn-character-sprite.${activeClass}`)
                  .removeClass('dimmed')
                  .css('z-index', 15);
            
            // 듣는 쪽(Inactive): 어둡게 처리
            $layer.find(`.vn-character-sprite.${inactiveClass}`)
                  .addClass('dimmed')
                  .css('z-index', 5);
        } else {
            // 유저 스프라이트 모드가 아닐 땐 항상 밝게
            $layer.find(`.vn-character-sprite`)
                  .removeClass('dimmed')
                  .css('z-index', 15);
        }

        // 2. 이미지 중복 체크 (이미지가 같으면 여기서 종료되지만, 위에서 밝기 처리는 이미 완료됨)
        if ((!ENABLE_USER_SPRITE || !isUser)) { 
            if (currentLeftSrc === src && currentLeftSrc !== "") return; 
            currentLeftSrc = src; 
        }
        if (ENABLE_USER_SPRITE && isUser) { 
            if (currentRightSrc === src && currentRightSrc !== "") return; 
            currentRightSrc = src; 
        }

        // 3. 이미지가 다를 경우에만 새로 생성 (기존 로직 유지)
        const $oldActive = $layer.find(`.vn-character-sprite.${activeClass}`).not('.exiting');
        $oldActive.addClass('exiting');
        
        // [추가 수정] 생성 시점에 바로 'vn-user-sprite' 클래스를 붙여서 CSS 슬라이더가 즉시 적용되도록 함
        const userClass = isUser ? 'vn-user-sprite' : '';

        const $newImg = $('<img>', { 
            src: src, 
            class: `vn-character-sprite ${activeClass} ${userClass}`, 
            css: { zIndex: 15 } 
        });
        
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
        $('#vn-input-area').hide(); $('#vn-indicator').hide(); $('#vn-text-content').show();
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

    $('#vn-overlay').on('click', '#vn-trans-btn', function (e) {
        stopProp(e);
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
                $vnTransBtn.prop('disabled', false).html(originalBtnContent); $vnInput.prop('disabled', false).focus();
            } else if (checks >= 150) { clearInterval(pollInterval); $vnTransBtn.prop('disabled', false).html(originalBtnContent); $vnInput.prop('disabled', false).focus(); }
        }, 100);
    });

    $('#vn-overlay').on('click', '#vn-user-sprite-toggle', function(e) {
        stopProp(e);
        ENABLE_USER_SPRITE = !ENABLE_USER_SPRITE;
        localStorage.setItem('vnModeUserSprite', ENABLE_USER_SPRITE);
        updateToggleButtonState();
        $('#vn-sprite-layer').empty();
        currentLeftSrc = ""; currentRightSrc = "";
        setTimeout(checkLastMessage, 100);
    });

    $(document).on('click', '#vn-toggle-btn', toggleVNMode);
    
    $('#vn-overlay').on('click', function (e) {
        if ($(e.target).closest('#vn-input-area, #vn-settings-area, #vn-bgm-panel, #vn-close-btn, #vn-preset-container').length > 0) return;
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

    $('#vn-send-btn').on('click', function(e) { stopProp(e); sendUserMessage(); });
    $('#vn-user-input').on('keydown', function (e) { stopProp(e); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendUserMessage(); } });
    $('#vn-close-btn').on('click', function (e) { stopProp(e); if(isVnModeOn) toggleVNMode(); });

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

    console.log("[VN Mode] v4.9 Loaded.");
});

// ======================================================
// [VN Mode] Sprite Slider Injector & Handler
// Copy this into the end of index.js
// ======================================================
(function() {
    // 유틸리티: 슬라이더 HTML 생성
    function createSliderHTML(id, label, min, max, step, defaultVal) {
        return `
        <div class="vn-slider-container">
            <div class="vn-slider-header">
                <span>${label}</span>
                <span class="vn-slider-val" id="${id}-val">${defaultVal}</span>
            </div>
            <input type="range" id="${id}" class="vn-slider-range" min="${min}" max="${max}" step="${step}" value="${defaultVal}">
        </div>`;
    }

    // 메인 주입 함수
    function injectSpriteSliders() {
        const panel = document.getElementById('vn-preset-panel');
        if (!panel) return;
        
        // 이미 주입되었는지 확인
        if (document.getElementById('vn-sprite-sliders-area')) return;

        const sliderArea = document.createElement('div');
        sliderArea.id = 'vn-sprite-sliders-area';
        sliderArea.className = 'vn-sprite-settings-group';
        
        let html = `<h5>🎨 스프라이트 조정</h5>`;
        
        // 캐릭터 슬라이더
        html += `<div style="margin-bottom:10px; font-size:0.85em; color:#7B1FA2; font-weight:bold;">[캐릭터]</div>`;
        html += createSliderHTML('vn-char-scale-slider', '크기 (Scale)', 0.5, 2.0, 0.05, 1.0);
        html += createSliderHTML('vn-char-x-slider', '가로 위치 (X)', -500, 500, 10, 0);
        html += createSliderHTML('vn-char-y-slider', '세로 위치 (Y)', -500, 500, 10, 0);

        // 유저 슬라이더
        html += `<div style="margin-top:15px; margin-bottom:10px; font-size:0.85em; color:#388E3C; font-weight:bold;">[유저]</div>`;
        html += createSliderHTML('vn-user-scale-slider', '크기 (Scale)', 0.5, 2.0, 0.05, 1.0);
        html += createSliderHTML('vn-user-x-slider', '가로 위치 (X)', -500, 500, 10, 0);
        html += createSliderHTML('vn-user-y-slider', '세로 위치 (Y)', -500, 500, 10, 0);

        sliderArea.innerHTML = html;
        panel.appendChild(sliderArea);

        // 이벤트 리스너 연결
        const setVar = (name, val, unit='') => document.documentElement.style.setProperty(name, val + unit);
        
        // 캐릭터 리스너
        document.getElementById('vn-char-scale-slider').addEventListener('input', (e) => {
            setVar('--vn-char-scale', e.target.value);
            document.getElementById('vn-char-scale-slider-val').innerText = e.target.value + 'x';
        });
        document.getElementById('vn-char-x-slider').addEventListener('input', (e) => {
            setVar('--vn-char-x', e.target.value, 'px');
            document.getElementById('vn-char-x-slider-val').innerText = e.target.value;
        });
        document.getElementById('vn-char-y-slider').addEventListener('input', (e) => {
            setVar('--vn-char-y', e.target.value, 'px');
            document.getElementById('vn-char-y-slider-val').innerText = e.target.value;
        });

        // 유저 리스너
        document.getElementById('vn-user-scale-slider').addEventListener('input', (e) => {
            setVar('--vn-user-scale', e.target.value);
            document.getElementById('vn-user-scale-slider-val').innerText = e.target.value + 'x';
        });
        document.getElementById('vn-user-x-slider').addEventListener('input', (e) => {
            setVar('--vn-user-x', e.target.value, 'px');
            document.getElementById('vn-user-x-slider-val').innerText = e.target.value;
        });
        document.getElementById('vn-user-y-slider').addEventListener('input', (e) => {
            setVar('--vn-user-y', e.target.value, 'px');
            document.getElementById('vn-user-y-slider-val').innerText = e.target.value;
        });
    }

    // [중요] 유저 스프라이트 식별용 클래스 추가 루프
    // 1초마다 체크하여 유저 스프라이트에 .vn-user-sprite 클래스를 붙임
    setInterval(() => {
        // 1. 슬라이더가 없으면 주입 시도 (패널이 열릴 때까지 대기)
        injectSpriteSliders();

        // 2. 유저 스프라이트 감지 (보통 확장기능에서 유저 이미지는 고정된 위치나 특정 속성을 가짐)
        // 힌트: 보통 User 이미지는 alt="User" 또는 src에 user 관련 문자열이 있거나,
        // 단순히 화면 좌/우측 끝에 고정된 요소일 수 있습니다.
        // 여기서는 '.vn-character-sprite' 중 특정 조건(예: 왼쪽/오른쪽 고정 클래스 등)을 찾거나
        // 만약 구분이 안 된다면 사용자가 직접 클릭하여 설정하는 방식을 고려해야 합니다.
        // **가정**: 유저 이미지는 보통 파일명이 'user'를 포함하거나 별도 생성됨.
        // 여기서는 모든 스프라이트를 돌며 확인합니다.
        
        const sprites = document.querySelectorAll('.vn-character-sprite');
        sprites.forEach(img => {
            // 만약 이미지 소스에 'user'가 포함되어 있거나, ID가 user라면 클래스 추가
            // (사용환경에 따라 조건 수정 필요: 예: img.src.includes('avatar'))
            if (img.src && (img.src.includes('user') || img.src.includes('User') || img.src.includes('avatar'))) {
                if (!img.classList.contains('vn-user-sprite')) {
                    img.classList.add('vn-user-sprite');
                }
            }
            // 혹은 유저 스프라이트 토글 버튼이 켜져있을 때 생성된 특정 요소를 타겟팅
        });
    }, 2000);
})();

