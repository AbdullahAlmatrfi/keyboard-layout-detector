(function () {
    var btn = document.getElementById('langToggleBtn');
    if (!btn || !window.i18next) return;

    function preferredLanguage() {
        var saved = localStorage.getItem('kld-help-lang');
        if (saved === 'ar' || saved === 'en') return saved;
        return ((navigator.language || '').toLowerCase().indexOf('ar') === 0) ? 'ar' : 'en';
    }

    function loadJson(path) {
        return fetch(path).then(function (r) {
            if (!r.ok) throw new Error('Failed loading ' + path);
            return r.json();
        });
    }

    function translateDom() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            el.textContent = i18next.t(key);
        });

        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-html');
            el.innerHTML = i18next.t(key);
        });

        var isAr = i18next.language === 'ar';
        document.documentElement.lang = isAr ? 'ar' : 'en';
        document.body.classList.toggle('lang-ar', isAr);

        btn.textContent = i18next.t(isAr ? 'lang.toEn' : 'lang.toAr');
        btn.setAttribute('aria-label', i18next.t(isAr ? 'lang.ariaToEn' : 'lang.ariaToAr'));
        btn.setAttribute('aria-pressed', isAr ? 'true' : 'false');
    }

    function animateLanguageSwap(updateFn) {
        var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            updateFn();
            return;
        }

        document.body.classList.add('lang-switching');
        setTimeout(function () {
            updateFn();
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    document.body.classList.remove('lang-switching');
                });
            });
        }, 120);
    }

    Promise.all([
        loadJson('locales/en.json'),
        loadJson('locales/ar.json')
    ]).then(function (loaded) {
        return i18next.init({
            lng: preferredLanguage(),
            fallbackLng: 'en',
            debug: false,
            interpolation: { escapeValue: false },
            resources: {
                en: { translation: loaded[0] },
                ar: { translation: loaded[1] }
            }
        });
    }).then(function () {
        translateDom();

        btn.addEventListener('click', function () {
            var next = i18next.language === 'ar' ? 'en' : 'ar';
            i18next.changeLanguage(next).then(function () {
                localStorage.setItem('kld-help-lang', next);
                animateLanguageSwap(translateDom);
            });
        });
    }).catch(function (e) {
        console.warn('i18n init failed:', e && e.message ? e.message : e);
    });
})();
