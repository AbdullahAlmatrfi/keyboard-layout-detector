// ─── KLD Standalone Demo Engine ───────────────────────────────────────
// Runs entirely inside the page — no extension needed.
var _kldOriginals = new WeakMap();

function _kldToast(msg, duration) {
    duration = duration || 2500;
    var t = document.getElementById('kld-demo-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'kld-demo-toast';
        Object.assign(t.style, {
            position: 'fixed', bottom: '28px', left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b', border: '1px solid #475569',
            color: '#f1f5f9', padding: '10px 24px', borderRadius: '10px',
            fontSize: '13px', zIndex: '9999', transition: 'opacity 0.3s',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            whiteSpace: 'nowrap', boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
            opacity: '0', pointerEvents: 'none'
        });
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._to);
    t._to = setTimeout(function () { t.style.opacity = '0'; }, duration);
}

function runFix(ta) {
    var isClean = !!ta.closest('.c-clean');
    var fixed = ta.dataset.fixed;

    if (isClean || fixed === undefined || fixed === '') {
        ta.style.transition = 'box-shadow 0.2s, border-color 0.2s';
        ta.style.borderColor = '#22c55e';
        ta.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.18)';
        _kldToast('✅ Text already looks correct — nothing to change');
        setTimeout(function () { ta.style.borderColor = ''; ta.style.boxShadow = ''; }, 1600);
        return;
    }

    if (!_kldOriginals.has(ta)) _kldOriginals.set(ta, ta.value);
    if (ta.value === fixed) { _kldToast('✅ Already fixed — press ↶ Undo to reset'); return; }

    ta.style.transition = 'box-shadow 0.15s, border-color 0.15s';
    ta.style.borderColor = '#ef4444';
    ta.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.18)';

    setTimeout(function () {
        ta.value = fixed;
        ta.style.borderColor = '#6366f1';
        ta.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.18)';
        _kldToast('🎉 Fixed! This is exactly what the extension does.');
        _kldShowUndo(ta);
        setTimeout(function () { ta.style.borderColor = ''; ta.style.boxShadow = ''; }, 1600);
    }, 280);
}

function _kldShowUndo(ta) {
    var existing = ta.parentElement.querySelector('.demo-undo-btn');
    if (existing) existing.remove();
    var btn = document.createElement('button');
    btn.className = 'demo-undo-btn';
    btn.textContent = '↶ Undo — restore original text';
    btn.onclick = function () {
        if (_kldOriginals.has(ta)) { ta.value = _kldOriginals.get(ta); _kldOriginals.delete(ta); }
        btn.remove();
        _kldToast('↶ Original text restored');
    };
    ta.insertAdjacentElement('afterend', btn);
}

function demoFix(btn) {
    var zone = btn.closest('.play-card') || btn.closest('.sc-demo') || btn.parentElement;
    var ta = zone ? zone.querySelector('textarea') : null;
    if (ta) runFix(ta);
}

// Ctrl+Alt and Ctrl+Z on any focused textarea
// Delegated click handler for all .demo-btn buttons (replaces inline onclick)
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('demo-btn')) demoFix(e.target);
});

document.addEventListener('keydown', function (e) {
    var ta = document.activeElement;
    if (!ta || ta.tagName !== 'TEXTAREA') return;

    if (e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        runFix(ta);
        return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ') {
        if (_kldOriginals.has(ta)) {
            e.preventDefault();
            ta.value = _kldOriginals.get(ta);
            _kldOriginals.delete(ta);
            var ub = ta.parentElement.querySelector('.demo-undo-btn');
            if (ub) ub.remove();
            _kldToast('↶ Original text restored');
        }
    }
}, true);

