(function () {
    'use strict';

    var STORAGE_KEY = 'kld-help-lang';
    var toggleBtn = document.getElementById('langToggle');

    var translations = {
        en: {
            title: 'Keyboard Layout Detector Privacy and Data Use',
            lastUpdated: 'Last updated:',
            'short.title': 'Short answer',
            'short.localOnly': 'Using shortcuts (Ctrl+Q, Ctrl+Alt, Ctrl+Shift+Q, Ctrl+Z) edits text locally in your own page only.',
            'short.noServer': 'No text is sent to servers during normal fixing.',
            'short.onlySubmit': 'Data leaves your browser only when you explicitly submit feedback/report forms to improve dictionary accuracy and fix reported bugs.',

            'why.title': 'Why correction and feedback are necessary',
            'why.correction1': 'Word correction is necessary to instantly recover text typed with the wrong keyboard layout, so you do not lose time rewriting.',
            'why.correction2': 'Dictionary-based scanning is necessary to reduce false conversions and protect valid words.',
            'why.feedback1': 'Feedback is necessary to improve real-world accuracy for slang, names, and edge cases that dictionaries miss.',
            'why.feedback2': 'Feedback also helps fix bugs faster by showing which page context triggered a problem.',
            'why.reassure': 'You stay in control: correction is local, and data is sent only when you choose to submit to improve dictionary accuracy and fix bugs.',

            'flows.title': 'Data flows in this project',
            'flows.fixing.title': '1) Keyboard fixing (content script)',
            'flows.fixing.l1': 'Runs on-page to detect/convert words in focused inputs.',
            'flows.fixing.l2': 'Uses local dictionary files bundled inside the extension.',
            'flows.fixing.l3': 'No network request is made for normal fixes.',
            'flows.popup.title': '2) Popup feedback',
            'flows.popup.l1': 'Sends only after you click <strong>Send</strong> to improve dictionary accuracy and fix bugs.',
            'flows.popup.l2': 'Default payload is privacy-safe and minimal.',
            'flows.popup.l3': 'You stay in control: no send happens unless you submit to improve dictionary accuracy and fix bugs.',
            'flows.report.title': '3) In-page wrong-word report',
            'flows.report.l1': 'When you report a wrong conversion, the pair <span class="mono">wrong -&gt; correct</span> is submitted to improve dictionary accuracy and fix conversion bugs.',
            'flows.report.l2': 'This report is also sent to Google Forms to improve dictionary quality and fix bugs faster.',
            'flows.storage.title': '4) Local storage',
            'flows.storage.l1': 'Pause setting: <span class="mono">chrome.storage.sync.pauseExtension</span>',
            'flows.storage.l2': 'Last shortcut used: <span class="mono">chrome.storage.local.kldLastShortcut</span>',
            'flows.storage.l3': 'Feedback draft text/type: <span class="mono">localStorage.kld-feedback-draft-v1</span>',

            'feedback.title': 'Exactly what popup feedback can include',
            'feedback.minTitle': 'Always included (minimal mode):',
            'feedback.min1': 'Feedback type and message you typed.',
            'feedback.min2': 'Host / page origin.',
            'feedback.min3': 'Shortcut used, extension version, browser language, OS, timestamp.',
            'feedback.reassure': 'Nothing extra is collected in feedback mode. Minimal mode is always on.',

            'notCollected.title': 'What is not collected automatically',
            'notCollected.l1': 'No passwords.',
            'notCollected.l2': 'No cookies, session tokens, or account secrets.',
            'notCollected.l3': 'No full form contents from web pages during normal keyboard fixing.',
            'notCollected.l4': 'No keystroke logging sent to external servers.',
            'notCollected.note': 'Important: if you type sensitive information into the feedback message yourself, that text will be submitted (only after you click Send) to help troubleshoot and fix your reported issue.',

            'permissions.title': 'Permissions and why they exist',
            'permissions.l1': '<span class="mono">storage</span>: save pause setting, shortcut context, and feedback draft.',
            'permissions.l2': '<span class="mono">tabs</span>: read active tab URL/host/title for optional debugging context.',
            'permissions.l3': '<span class="mono">&lt;all_urls&gt;</span> content script: keyboard-fix feature must run where you type.',
            'permissions.l4': '<span class="mono">https://docs.google.com/*</span>: send feedback/report submissions to improve dictionary accuracy and fix bugs.',

            'where.title': 'Where data is sent',
            'where.l1': 'Feedback and report submissions go to Google Forms endpoints controlled by the project owner to improve dictionary accuracy and fix bugs.',
            'where.l2': 'No other external analytics endpoint is configured in this extension.',
            'where.warn': 'Only send information you are comfortable sharing.',
            'where.reassure': 'You stay in control: if you do not submit, nothing leaves your browser. If you do submit, it is only to improve dictionary accuracy and fix bugs.',

            'controls.title': 'Your controls',
            'controls.l1': 'Use shortcuts confidently: correction runs on your device only.',
            'controls.l2': 'Edit/remove feedback text before sending.',
            'controls.l3': 'Do not use report/feedback features if you do not want any data sent externally for dictionary improvement and bug fixing.',
            'controls.l4': 'Use the Pause switch to stop active correction behavior.',

            toggleLabel: 'العربية'
        },

        ar: {
            title: 'الخصوصية واستخدام البيانات في Keyboard Layout Detector',
            lastUpdated: 'آخر تحديث:',
            'short.title': 'الخلاصة السريعة',
            'short.localOnly': 'استخدام الاختصارات (Ctrl+Q و Ctrl+Alt و Ctrl+Shift+Q و Ctrl+Z) يعدل النص محليا داخل صفحتك فقط.',
            'short.noServer': 'لا يتم إرسال النص إلى أي خادم أثناء التصحيح العادي.',
            'short.onlySubmit': 'تغادر البيانات متصفحك فقط عند إرسال نموذج الملاحظات أو البلاغ بشكل صريح لتحسين دقة القاموس وإصلاح الأخطاء المبلغ عنها.',

            'why.title': 'لماذا التصحيح والملاحظات ضروريان',
            'why.correction1': 'تصحيح الكلمات ضروري لاسترجاع النص المكتوب بلوحة مفاتيح خاطئة فورًا حتى لا تضيع وقتك في إعادة الكتابة.',
            'why.correction2': 'الفحص المعتمد على القاموس ضروري لتقليل التحويلات الخاطئة وحماية الكلمات الصحيحة.',
            'why.feedback1': 'الملاحظات ضرورية لتحسين الدقة في الحالات الواقعية مثل الأسماء والاختصارات والحالات التي لا يغطيها القاموس.',
            'why.feedback2': 'الملاحظات تساعد أيضًا على إصلاح الأعطال أسرع عبر توضيح سياق الصفحة الذي ظهر فيه الخطأ.',
            'why.reassure': 'أنت المتحكم: التصحيح محلي، ولا يتم إرسال البيانات إلا عندما تختار الإرسال لتحسين دقة القاموس وإصلاح الأخطاء.',

            'flows.title': 'تدفق البيانات في هذا المشروع',
            'flows.fixing.title': '1) تصحيح لوحة المفاتيح (Content Script)',
            'flows.fixing.l1': 'يعمل داخل الصفحة لاكتشاف/تحويل الكلمات في الحقول النشطة.',
            'flows.fixing.l2': 'يستخدم ملفات قاموس محلية مرفقة داخل الإضافة.',
            'flows.fixing.l3': 'لا يتم إجراء أي طلب شبكة أثناء التصحيح العادي.',
            'flows.popup.title': '2) ملاحظات النافذة المنبثقة',
            'flows.popup.l1': 'لا يتم الإرسال إلا بعد الضغط على <strong>Send</strong> لتحسين دقة القاموس وإصلاح الأخطاء.',
            'flows.popup.l2': 'البيانات الافتراضية آمنة للخصوصية ومحدودة.',
            'flows.popup.l3': 'أنت المتحكم: لا يحدث أي إرسال إلا إذا ضغطت إرسال لتحسين دقة القاموس وإصلاح الأخطاء.',
            'flows.report.title': '3) الإبلاغ داخل الصفحة عن كلمة خاطئة',
            'flows.report.l1': 'عند الإبلاغ عن تحويل خاطئ، يتم إرسال الزوج <span class="mono">wrong -&gt; correct</span> لتحسين دقة القاموس وإصلاح أخطاء التحويل.',
            'flows.report.l2': 'يتم إرسال هذا البلاغ أيضا إلى Google Forms لتحسين جودة القاموس وتسريع إصلاح الأخطاء.',
            'flows.storage.title': '4) التخزين المحلي',
            'flows.storage.l1': 'إعداد الإيقاف المؤقت: <span class="mono">chrome.storage.sync.pauseExtension</span>',
            'flows.storage.l2': 'آخر اختصار مستخدم: <span class="mono">chrome.storage.local.kldLastShortcut</span>',
            'flows.storage.l3': 'مسودة الملاحظات (النص/النوع): <span class="mono">localStorage.kld-feedback-draft-v1</span>',

            'feedback.title': 'ما الذي قد تتضمنه ملاحظات النافذة المنبثقة',
            'feedback.minTitle': 'يتم تضمينه دائما (الوضع الأدنى):',
            'feedback.min1': 'نوع الملاحظة والرسالة التي كتبتها.',
            'feedback.min2': 'المضيف / أصل الصفحة.',
            'feedback.min3': 'الاختصار المستخدم، إصدار الإضافة، لغة المتصفح، نظام التشغيل، والطابع الزمني.',
            'feedback.reassure': 'لا يتم جمع أي بيانات إضافية في وضع الملاحظات. الوضع الأدنى مفعل دائمًا.',

            'notCollected.title': 'ما لا يتم جمعه تلقائيا',
            'notCollected.l1': 'لا كلمات مرور.',
            'notCollected.l2': 'لا cookies ولا session tokens ولا أسرار حساب.',
            'notCollected.l3': 'لا يتم جمع المحتوى الكامل لحقول النماذج أثناء التصحيح العادي.',
            'notCollected.l4': 'لا يتم إرسال تسجيل ضغطات المفاتيح إلى خوادم خارجية.',
            'notCollected.note': 'مهم: إذا كتبت معلومات حساسة داخل رسالة الملاحظات بنفسك، فسيتم إرسالها (فقط بعد الضغط على Send) للمساعدة في تتبع المشكلة التي أبلغت عنها وإصلاحها.',

            'permissions.title': 'الأذونات ولماذا نحتاجها',
            'permissions.l1': '<span class="mono">storage</span>: حفظ حالة الإيقاف المؤقت وسياق الاختصار ومسودة الملاحظات.',
            'permissions.l2': '<span class="mono">tabs</span>: قراءة رابط/مضيف/عنوان التبويب النشط لسياق تصحيح اختياري.',
            'permissions.l3': '<span class="mono">&lt;all_urls&gt;</span> content script: ميزة التصحيح يجب أن تعمل حيث تكتب.',
            'permissions.l4': '<span class="mono">https://docs.google.com/*</span>: إرسال الملاحظات والبلاغات لتحسين دقة القاموس وإصلاح الأخطاء.',

            'where.title': 'إلى أين تُرسل البيانات',
            'where.l1': 'يتم إرسال الملاحظات والبلاغات إلى نقاط Google Forms التي يديرها صاحب المشروع لتحسين دقة القاموس وإصلاح الأخطاء.',
            'where.l2': 'لا توجد أي نقطة تحليلات خارجية أخرى مفعلة في هذه الإضافة.',
            'where.warn': 'أرسل فقط المعلومات التي تشعر بالارتياح لمشاركتها.',
            'where.reassure': 'أنت المتحكم: إذا لم ترسل، فلن يغادر أي شيء متصفحك. وإذا أرسلت، فالهدف فقط تحسين دقة القاموس وإصلاح الأخطاء.',

            'controls.title': 'خياراتك',
            'controls.l1': 'استخدم الاختصارات بثقة: التصحيح يعمل على جهازك فقط.',
            'controls.l2': 'يمكنك تعديل/حذف نص الملاحظة قبل الإرسال.',
            'controls.l3': 'لا تستخدم ميزات البلاغ/الملاحظات إذا لا تريد أي إرسال خارجي للبيانات لتحسين القاموس وإصلاح الأخطاء.',
            'controls.l4': 'استخدم زر Pause لإيقاف سلوك التصحيح النشط.',

            toggleLabel: 'English'
        }
    };

    function preferredLanguage() {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'ar') return saved;
        return ((navigator.language || '').toLowerCase().indexOf('ar') === 0) ? 'ar' : 'en';
    }

    function applyLanguage(lang) {
        var dict = translations[lang] || translations.en;

        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });

        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-html');
            if (dict[key]) el.innerHTML = dict[key];
        });

        if (toggleBtn) {
            toggleBtn.textContent = dict.toggleLabel;
            toggleBtn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
        }

        localStorage.setItem(STORAGE_KEY, lang);
    }

    var current = preferredLanguage();
    applyLanguage(current);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            current = current === 'ar' ? 'en' : 'ar';
            applyLanguage(current);
        });
    }
})();
